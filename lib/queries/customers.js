import sql from '../db';

/**
 * Search customers by name for the autocomplete field.
 * Returns top 5 matches ordered by their most recent order date.
 */
export async function searchCustomersByName(name) {
  return await sql`
    SELECT c.* 
    FROM customers c
    LEFT JOIN (
      SELECT customer_id, MAX(order_date) as last_order 
      FROM orders 
      GROUP BY customer_id
    ) o ON c.id = o.customer_id
    WHERE c.name ILIKE ${'%' + name + '%'}
    ORDER BY o.last_order DESC NULLS LAST
    LIMIT 5
  `;
}

export async function findCustomerByPhone(phone) {
  const result = await sql`
    SELECT * FROM customers WHERE phone = ${phone} LIMIT 1
  `;
  return result[0];
}

export async function createCustomer({ name, phone, address }) {
  const result = await sql`
    INSERT INTO customers (name, phone, address)
    VALUES (${name}, ${phone}, ${address})
    RETURNING *
  `;
  return result[0];
}

export async function updateCustomerAddress(id, address) {
  return await sql`
    UPDATE customers SET address = ${address} WHERE id = ${id}
    RETURNING *
  `;
}
