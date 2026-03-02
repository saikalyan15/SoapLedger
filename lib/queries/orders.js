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
      (SELECT COUNT(*) FROM orders o2 WHERE o2.customer_id = s.customer_id AND o2.created_at < s.created_at) as previous_orders_count
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
      (SELECT COUNT(*) FROM orders o2 WHERE o2.customer_id = s.customer_id AND o2.created_at < s.created_at) > 0 as is_returning
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

  const [order] = await sql`
    INSERT INTO orders (
      customer_id, order_date, order_value, 
      shipping_charge, packaging_cost, status
    ) VALUES (
      ${customerId}, ${orderData.order_date}, ${orderData.order_value}, 
      ${orderData.shipping_charge}, ${orderData.packaging_cost}, 
      ${orderData.status || 'Order Placed'}
    ) RETURNING id
  `;

  for (const item of items) {
    await sql`
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price
      ) VALUES (
        ${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price}
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
      status = ${orderData.status}
    WHERE id = ${id}
  `;

  await sql`DELETE FROM order_items WHERE order_id = ${id}`;
  
  for (const item of items) {
    await sql`
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price
      ) VALUES (
        ${id}, ${item.product_id}, ${item.quantity}, ${item.unit_price}
      )
    `;
  }
  
  return id;
}

export async function updateOrderStatus(id, status) {
  return await sql`
    UPDATE orders 
    SET 
      status = ${status},
      dispatched_at = CASE WHEN ${status} = 'Dispatched' THEN CURRENT_TIMESTAMP ELSE dispatched_at END,
      delivered_at = CASE WHEN ${status} = 'Delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
    WHERE id = ${id}
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
