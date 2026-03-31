import sql from '@/lib/db';

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
        (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = s.id),
        0
      ) as total_soaps,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM orders o2 
          WHERE o2.customer_id = s.customer_id 
          AND o2.id != s.id 
          AND o2.order_date < s.order_date
        ) THEN 'Returning'
        ELSE 'New'
      END as customer_type
    FROM order_summary s 
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
      shipping_charge, packaging_cost, customization_amount, status, notes
    ) VALUES (
      ${customerId}, ${orderData.order_date}, ${orderData.order_value},
      ${orderData.shipping_charge}, ${orderData.packaging_cost},
      ${orderData.customization_amount || 0},
      ${orderData.status || 'Order Placed'},
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
      INSERT INTO shipments (order_id, status, address_text, label)
      VALUES (${order.id}, ${s.status || orderData.status || 'Order Placed'}, ${s.address_text}, ${s.label})
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
      INSERT INTO shipments (order_id, status, address_text, label)
      VALUES (${id}, ${s.status || existing.status}, ${s.address_text}, ${s.label})
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
  
  return id;
}

export async function updateOrderStatus(id, status) {
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

export async function getShipmentsByOrderId(orderId) {
  return await sql`
    SELECT * FROM shipments WHERE order_id = ${orderId} ORDER BY created_at ASC
  `;
}

export async function updateShipmentStatus(id, status) {
  // 1. Find the parent order
  const [shipment] = await sql`SELECT order_id FROM shipments WHERE id = ${id}`;
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

  await sql`UPDATE orders SET status = ${orderStatus} WHERE id = ${orderId}`;
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
