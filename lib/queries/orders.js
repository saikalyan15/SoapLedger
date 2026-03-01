import sql from '../db';

export async function getActiveProducts() {
  return await sql`
    SELECT id, name, base_type, unit_price 
    FROM products 
    WHERE is_active = true 
    ORDER BY base_type, name
  `;
}

export async function getSettings() {
  const rows = await sql`SELECT key, value FROM settings`;
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export async function getAllOrders() {
  return await sql`
    SELECT 
      o.*, 
      c.name as customer_name,
      c.phone as customer_phone
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.order_date DESC, o.created_at DESC
  `;
}

export async function getOrderById(id) {
  const order = await sql`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ${id}
  `;
  
  const items = await sql`
    SELECT oi.*, p.name as product_name, p.base_type
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ${id}
  `;

  return { ...order[0], items };
}

export async function deleteOrder(id) {
  // Only allow deletion if status is not 'Delivered'
  return await sql`
    DELETE FROM orders 
    WHERE id = ${id} AND status != 'Delivered'
    RETURNING id
  `;
}

/**
 * Creates an order with a manual transaction flow.
 * 1. Upserts customer by phone
 * 2. Creates the order
 * 3. Creates order items with snapshotted prices
 */
export async function createOrder(customerData, orderData, items) {
  try {
    // 1. Upsert Customer
    let customerId;
    const existing = await sql`SELECT id FROM customers WHERE phone = ${customerData.phone} LIMIT 1`;
    
    if (existing.length > 0) {
      customerId = existing[0].id;
      await sql`
        UPDATE customers 
        SET name = ${customerData.name}, address = ${customerData.address} 
        WHERE id = ${customerId}
      `;
    } else {
      const newCust = await sql`
        INSERT INTO customers (name, phone, address) 
        VALUES (${customerData.name}, ${customerData.phone}, ${customerData.address}) 
        RETURNING id
      `;
      customerId = newCust[0].id;
    }

    // 2. Insert Order
    const newOrder = await sql`
      INSERT INTO orders (
        customer_id, order_date, order_value, shipping_charge, 
        packaging_cost, material_cost, status, notes
      ) VALUES (
        ${customerId}, ${orderData.order_date}, ${orderData.order_value}, 
        ${orderData.shipping_charge}, ${orderData.packaging_cost}, 
        ${orderData.material_cost}, ${orderData.status}, ${orderData.notes}
      ) RETURNING id
    `;
    const orderId = newOrder[0].id;

    // 3. Insert Items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${orderId}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
      `;
    }

    return orderId;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
