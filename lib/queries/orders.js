import sql from '@/lib/db';
import { autoPromoteFrequentOils } from './essential_oils';

export async function getActiveProducts() {
  return await sql`
    SELECT id, name, base_type, unit_price FROM products
    WHERE is_active = true 
    ORDER BY base_type, name
  `;
}

export async function getSettings() {
  const result = await sql`SELECT key, value FROM settings`;
  // Convert array of {key, value} to a single object {key: value}
  return result.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
}

export async function getOrderById(id) {
  const result = await sql`
    SELECT 
      s.*,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM orders o2 
          WHERE o2.customer_id = s.customer_id 
          AND o2.id != s.id 
          AND o2.order_date < s.order_date
          AND o2.source IS DISTINCT FROM 'Expression of Interest'
        ) THEN 'Returning'
        ELSE 'New'
      END as customer_type
    FROM order_summary s 
    WHERE s.id = ${id}
  `;
  return result[0];
}

export async function getOrderItems(orderId) {
  return await sql`
    SELECT * FROM order_items_detail WHERE order_id = ${orderId}
  `;
}

export async function getPaymentAttemptsByOrderId(orderId) {
  return await sql`
    SELECT id, provider_order_id, provider_payment_id, status, method,
           error_code, error_description, error_source, error_step, error_reason,
           amount_paise, currency, provider_created_at, created_at, updated_at
    FROM payment_attempts
    WHERE order_id = ${orderId}
    ORDER BY COALESCE(provider_created_at, created_at) DESC, created_at DESC
  `;
}

export async function getAllOrders() {
  return await sql`
    SELECT 
      s.*,
      COALESCE(
        (
          SELECT string_agg(p.name, ', ')
          FROM order_items oi
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = s.id
        ),
        'No items'
      ) as products,
      COALESCE(
        (SELECT SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END)
         FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = s.id),
        0
      ) as total_soaps,
      (
        SELECT MIN(sh.dispatched_at)
        FROM shipments sh
        WHERE sh.order_id = s.id
      ) as shipped_at,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM orders o2 
          WHERE o2.customer_id = s.customer_id 
          AND o2.id != s.id 
          AND o2.order_date < s.order_date
          AND o2.source IS DISTINCT FROM 'Expression of Interest'
        ) THEN 'Returning'
        ELSE 'New'
      END as customer_type
    FROM order_summary s 
    WHERE s.source IS DISTINCT FROM 'Expression of Interest'
    ORDER BY s.order_date DESC, s.created_at DESC
  `;
}

export async function createOrder(customerData, orderData, items) {
  let customerId = customerData.id;
  
  if (!customerId) {
    const [newCustomer] = await sql`
      INSERT INTO customers (name, phone, address)
      VALUES (${customerData.name}, ${customerData.phone}, ${customerData.address})
      RETURNING id
    `;
    customerId = newCustomer.id;
  } else {
    await sql`
      UPDATE customers SET
        address = ${customerData.address},
        phone = ${customerData.phone}
        WHERE id = ${customerId}
    `;
  }

  // Ensure customer has a saved address record
  await sql`
    INSERT INTO customer_addresses (customer_id, label, address_text, is_default)
    VALUES (${customerId}, 'Primary', ${customerData.address}, TRUE)
    ON CONFLICT DO NOTHING
  `;

  const [order] = await sql`
    INSERT INTO orders (
      customer_id, order_date, order_value,
      shipping_charge, packaging_cost, customization_amount, status, source, notes
    ) VALUES (
      ${customerId}, ${orderData.order_date}, ${orderData.order_value},
      ${orderData.shipping_charge}, ${orderData.packaging_cost},
      ${orderData.customization_amount || 0},
      ${orderData.status || 'Order Placed'},
      ${orderData.source || null},
      ${orderData.notes || null}
    ) RETURNING id
  `;

  // Create shipments
  const shipmentMap = {}; // To map form index to DB ID
  const defaultLabel = customerData.name || 'Primary Shipment';
  const formShipments = orderData.shipments || [{ label: defaultLabel, address_text: customerData.address, status: orderData.status || 'Order Placed' }];

  for (let i = 0; i < formShipments.length; i++) {
    const s = formShipments[i];
    const [shipment] = await sql`
      INSERT INTO shipments (order_id, status, address_text, label, city, state)
      VALUES (${order.id}, ${s.status || orderData.status || 'Order Placed'}, ${s.address_text}, ${s.label}, ${s.city || null}, ${s.state || null})
      RETURNING id
    `;
    shipmentMap[i] = shipment.id;
  }

  for (const item of items) {
    const shipmentId = shipmentMap[item.shipmentIndex] || shipmentMap[0];
    await sql`
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price, shipment_id
      ) VALUES (
        ${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price}, ${shipmentId}
      )
    `;
  }

  await autoPromoteFrequentOils();
  return order.id;
}

export async function updateOrder(id, customerData, orderData, items) {
  const [existing] = await sql`SELECT status FROM orders WHERE id = ${id}`;
  
  const EDITABLE_STATUSES = [
    'Order Placed',
    'Awaiting Payment',
    'Payment Confirmed',
    'In Manufacturing',
    'Ready to Dispatch'
  ];

  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw new Error(`Cannot edit order in ${existing.status} status`);
  }

  await sql`
    UPDATE customers SET
      address = ${customerData.address},
      phone = ${customerData.phone}
    WHERE id = ${customerData.id}
  `;

  await sql`
    UPDATE orders SET
      order_date = ${orderData.order_date},
      order_value = ${orderData.order_value},
      shipping_charge = ${orderData.shipping_charge},
      packaging_cost = ${orderData.packaging_cost},
      customization_amount = ${orderData.customization_amount || 0},
      status = ${orderData.status || existing.status},
      source = ${orderData.source || null},
      notes = ${orderData.notes || null}
    WHERE id = ${id}
  `;

  // Handle Shipments for Update
  // For simplicity: delete existing shipments and recreate, 
  // OR update existing ones. Let's delete and recreate to match the form state.
  await sql`DELETE FROM order_items WHERE order_id = ${id}`;
  await sql`DELETE FROM shipments WHERE order_id = ${id}`;

  const shipmentMap = {};
  const formShipments = orderData.shipments || [{ label: 'Primary Shipment', address_text: customerData.address, status: existing.status }];

  for (let i = 0; i < formShipments.length; i++) {
    const s = formShipments[i];
    const [shipment] = await sql`
      INSERT INTO shipments (order_id, status, address_text, label, city, state)
      VALUES (${id}, ${s.status || existing.status}, ${s.address_text}, ${s.label}, ${s.city || null}, ${s.state || null})
      RETURNING id
    `;
    shipmentMap[i] = shipment.id;
  }
  
  for (const item of items) {
    const shipmentId = shipmentMap[item.shipmentIndex] || shipmentMap[0];
    await sql`
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price, shipment_id
      ) VALUES (
        ${id}, ${item.product_id}, ${item.quantity}, ${item.unit_price}, ${shipmentId}
      )
    `;
  }

  await autoPromoteFrequentOils();
  return id;
}

export async function updateOrderStatus(id, status) {
  const [order] = await sql`SELECT id FROM orders WHERE id = ${id}`;
  if (!order) throw new Error('Order not found');

  // Update all shipments for this order to keep simple UI working for now
  await sql`
    UPDATE shipments 
    SET 
      status = ${status},
      dispatched_at = CASE WHEN ${status} = 'Dispatched' THEN CURRENT_TIMESTAMP ELSE dispatched_at END,
      delivered_at = CASE WHEN ${status} = 'Delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
    WHERE order_id = ${id}
  `;

  return await sql`
    UPDATE orders 
    SET status = ${status}
    WHERE id = ${id}
  `;
}

export async function markOrderComplimentary(id) {
  const [order] = await sql`
    SELECT order_value, payment_provider, payment_status
    FROM orders
    WHERE id = ${id}
  `;
  if (!order) throw new Error('Order not found');
  if (order.payment_provider === 'razorpay') {
    throw new Error('Razorpay orders must be reconciled from the Payment card.');
  }
  if (Number(order.order_value) !== 0) {
    throw new Error('Only zero-value orders can be marked as complimentary.');
  }

  await sql`
    UPDATE orders
    SET status = 'Payment Confirmed', payment_status = 'manual'
    WHERE id = ${id}
  `;
  await sql`UPDATE shipments SET status = 'Payment Confirmed' WHERE order_id = ${id}`;
}

export async function getShipmentsByOrderId(orderId) {
  return await sql`
    SELECT * FROM shipments WHERE order_id = ${orderId} ORDER BY created_at ASC
  `;
}

export async function updateShipmentStatus(id, status) {
  // 1. Find the parent order
  const [shipment] = await sql`
    SELECT s.order_id, o.order_value, o.payment_provider, o.payment_status
    FROM shipments s
    JOIN orders o ON o.id = s.order_id
    WHERE s.id = ${id}
  `;
  if (!shipment) return;
  const orderId = shipment.order_id;

  // 2. Update the shipment
  await sql`
    UPDATE shipments
    SET
      status = ${status},
      dispatched_at = CASE WHEN ${status} = 'Dispatched' THEN CURRENT_TIMESTAMP ELSE dispatched_at END,
      delivered_at = CASE WHEN ${status} = 'Delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
    WHERE id = ${id}
  `;

  // 3. Recompute and sync orders.status from all shipments (mirrors the view logic)
  const allShipments = await sql`SELECT status FROM shipments WHERE order_id = ${orderId}`;
  const statuses = allShipments.map(s => s.status);

  let orderStatus;
  if (statuses.every(s => s === 'Delivered')) {
    orderStatus = 'Delivered';
  } else if (statuses.some(s => s === 'Delivered') && statuses.some(s => s !== 'Delivered')) {
    orderStatus = 'Partially Delivered';
  } else if (statuses.some(s => s === 'Dispatched') && statuses.some(s => !['Dispatched', 'Delivered'].includes(s))) {
    orderStatus = 'Partially Dispatched';
  } else {
    const priority = ['Delivered', 'Dispatched', 'Ready to Dispatch', 'In Manufacturing', 'Payment Confirmed', 'Awaiting Payment', 'Order Placed', 'Cancelled'];
    orderStatus = statuses.reduce((best, s) => {
      return priority.indexOf(s) < priority.indexOf(best) ? s : best;
    }, statuses[0]);
  }

  await sql`
    UPDATE orders
    SET status = ${orderStatus}
    WHERE id = ${orderId}
  `;
}

export async function deleteOrder(id) {
  const [existing] = await sql`SELECT status FROM orders WHERE id = ${id}`;
  
  const EDITABLE_STATUSES = [
    'Order Placed',
    'Awaiting Payment',
    'Payment Confirmed',
    'In Manufacturing',
    'Ready to Dispatch'
  ];

  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw new Error(`Cannot delete order in ${existing.status} status`);
  }

  await sql`DELETE FROM order_items WHERE order_id = ${id}`;
  await sql`DELETE FROM orders WHERE id = ${id}`;
}

export async function getCustomerOrderHistory(customerId) {
  return await sql`
    SELECT 
      o.id, 
      o.order_date, 
      o.order_value, 
      o.status,
      (SELECT string_agg(product_name, ', ') FROM order_items_detail WHERE order_id = o.id) as products
    FROM orders o
    WHERE o.customer_id = ${customerId}
    ORDER BY o.order_date DESC
  `;
}

export async function getOrdersBySource(days = 60) {
  return await sql`
    SELECT
      source,
      COUNT(*) as orders,
      SUM(order_value) as revenue
    FROM orders
    WHERE order_date >= CURRENT_DATE - CAST(${days} || ' days' AS INTERVAL)
      AND source IS NOT NULL
      AND source != 'Expression of Interest'
    GROUP BY source
    ORDER BY orders DESC
  `;
}

export async function getPendingDispatchShipments() {
  return await sql`
    SELECT
      s.id AS shipment_id,
      s.order_id,
      s.label AS shipment_label,
      s.address_text,
      s.status AS shipment_status,
      o.order_date,
      o.status AS order_status,
      c.name AS customer_name,
      c.phone AS customer_phone
    FROM shipments s
    JOIN orders o ON o.id = s.order_id
    JOIN customers c ON c.id = o.customer_id
    WHERE s.status NOT IN ('Dispatched', 'Delivered', 'Cancelled')
      AND o.status != 'Cancelled'
      AND o.source IS DISTINCT FROM 'Expression of Interest'
    ORDER BY o.order_date ASC, c.name ASC
  `;
}

export async function getEssentialOilsForOrder(orderId) {
  return await sql`
    SELECT
      p.id          AS product_id,
      p.name        AS product_name,
      oi.quantity   AS soap_qty,
      eo.id         AS oil_id,
      eo.name       AS oil_name,
      eo.notes      AS oil_notes,
      oi.quantity   AS units_needed
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN product_essential_oils peo
      ON peo.product_id = p.id AND peo.is_default = TRUE
    LEFT JOIN essential_oils eo
      ON eo.id = peo.essential_oil_id
    WHERE oi.order_id = ${orderId}
    ORDER BY p.name ASC
  `;
}
