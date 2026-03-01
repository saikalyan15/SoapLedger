import sql from '@/lib/db';

export async function getActiveProducts() {
  return await sql`
    SELECT id, name, base_type, unit_price FROM products
    WHERE is_active = true 
    ORDER BY base_type, name
  `;
}

export async function getSettings() {
  const rows = await sql`SELECT key, value FROM settings`;
  // Convert array of {key, value} to an object
  return rows.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
}

export async function getAllOrders() {
  return await sql`SELECT * FROM order_summary ORDER BY order_date DESC`;
}

export async function getOrderById(id) {
  const result = await sql`SELECT * FROM order_summary WHERE id = ${id}`;
  return result[0];
}

export async function getOrderItems(orderId) {
  return await sql`SELECT * FROM order_items_detail WHERE order_id = ${orderId}`;
}

export async function createOrder(customerData, orderData, items) {
  // customerData: { name, phone, address, notes }
  // orderData: { order_date, order_value, shipping_charge, packaging_cost, material_cost, status, notes }
  // items: [ { product_id, quantity, unit_price } ]

  try {
    const [result] = await sql.begin(async (sql) => {
      // 1. Upsert customer
      const [customer] = await sql`
        INSERT INTO customers (name, phone, address)
        VALUES (${customerData.name}, ${customerData.phone}, ${customerData.address})
        ON CONFLICT (phone) DO UPDATE SET 
          name = EXCLUDED.name,
          address = EXCLUDED.address
        RETURNING id
      `;

      // 2. Insert order
      const [order] = await sql`
        INSERT INTO orders (
          customer_id, order_date, order_value, shipping_charge, 
          packaging_cost, material_cost, status, notes
        )
        VALUES (
          ${customer.id}, ${orderData.order_date}, ${orderData.order_value}, 
          ${orderData.shipping_charge}, ${orderData.packaging_cost}, 
          ${orderData.material_cost}, ${orderData.status}, ${orderData.notes}
        )
        RETURNING id
      `;

      // 3. Insert order items
      for (const item of items) {
        await sql`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
        `;
      }

      return [order];
    });

    return result.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrder(id, orderData, items) {
  // Check status first
  const order = await getOrderById(id);
  const lockedStatuses = ['Dispatched', 'Delivered', 'Cancelled'];
  if (lockedStatuses.includes(order.status)) {
    throw new Error(`Order is ${order.status} and cannot be updated.`);
  }

  try {
    await sql.begin(async (sql) => {
      // 1. Update order
      await sql`
        UPDATE orders SET
          order_date = ${orderData.order_date},
          order_value = ${orderData.order_value},
          shipping_charge = ${orderData.shipping_charge},
          packaging_cost = ${orderData.packaging_cost},
          material_cost = ${orderData.material_cost},
          status = ${orderData.status},
          notes = ${orderData.notes}
        WHERE id = ${id}
      `;

      // 2. Delete existing items
      await sql`DELETE FROM order_items WHERE order_id = ${id}`;

      // 3. Re-insert items
      for (const item of items) {
        await sql`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES (${id}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
        `;
      }
    });

    return id;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function deleteOrder(id) {
  // Check status first
  const order = await getOrderById(id);
  const lockedStatuses = ['Dispatched', 'Delivered', 'Cancelled'];
  if (lockedStatuses.includes(order.status)) {
    throw new Error(`Order is ${order.status} and cannot be deleted.`);
  }

  return await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`;
}

export async function updateOrderStatus(id, status) {
  return await sql`UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING id`;
}
