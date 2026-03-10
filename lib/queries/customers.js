import sql from '@/lib/db';

export async function getAllCustomers() {
  return await sql`
    SELECT c.*, COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id 
    ORDER BY c.created_at DESC
  `;
}

export async function searchCustomersByName(query) {
  const ilikeQuery = `%${query}%`;
  return await sql`
    SELECT id, name, phone, address FROM customers
    WHERE name ILIKE ${ilikeQuery}
    ORDER BY created_at DESC 
    LIMIT 5
  `;
}

export async function getCustomerById(id) {
  const result = await sql`SELECT * FROM customers WHERE id = ${id}`;
  return result[0];
}

export async function createCustomer(name, phone, address, notes) {
  const result = await sql`
    INSERT INTO customers (name, phone, address, notes)
    VALUES (${name}, ${phone}, ${address}, ${notes})
    RETURNING *
  `;
  return result[0];
}

export async function updateCustomer(id, name, phone, address, notes) {
  const result = await sql`
    UPDATE customers 
    SET name = ${name}, phone = ${phone}, address = ${address}, notes = ${notes}
    WHERE id = ${id}
    RETURNING *
  `;
  
  // Also update the 'Primary' address record in customer_addresses
  await sql`
    UPDATE customer_addresses 
    SET address_text = ${address}
    WHERE customer_id = ${id} AND label = 'Primary'
  `;

  return result[0];
}

export async function getAddressesByCustomerId(customerId) {
  return await sql`
    SELECT * FROM customer_addresses 
    WHERE customer_id = ${customerId} 
    ORDER BY is_default DESC, created_at ASC
  `;
}

export async function updateCustomerAddresses(customerId, addresses) {
  // addresses: [{label, address_text, is_default}, ...]
  // We'll replace all except 'Primary' to keep it simple, or sync.
  // For now, let's just make sure we can fetch them.
}

export async function deleteCustomer(id) {
  // Check if they have orders first
  const orderCountResult = await sql`SELECT COUNT(*) as count FROM orders WHERE customer_id = ${id}`;
  if (parseInt(orderCountResult[0].count) > 0) {
    throw new Error('Customer has orders and cannot be deleted.');
  }

  return await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`;
}
