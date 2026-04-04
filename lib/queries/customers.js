import sql from '@/lib/db';
import { normaliseToE164 } from '@/lib/utils/phone';

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
    VALUES (${name}, ${normaliseToE164(phone)}, ${address}, ${notes})
    RETURNING *
  `;
  return result[0];
}

export async function updateCustomer(id, name, phone, address, notes) {
  const result = await sql`
    UPDATE customers
    SET name = ${name}, phone = ${normaliseToE164(phone)}, address = ${address}, notes = ${notes}
    WHERE id = ${id}
    RETURNING *
  `;
  
  // Also update the 'Primary' address record in customer_addresses
  await sql`
    UPDATE customer_addresses 
    SET address_text = ${address}
    WHERE customer_id = ${id} AND label = 'Primary'
  `;

  // Reflection: Update address on all PENDING shipments for this customer
  // This ensures that if they move, their current orders go to the new address.
  await sql`
    UPDATE shipments 
    SET address_text = ${address}
    WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ${id})
    AND status IN ('Order Placed', 'Awaiting Payment', 'Payment Confirmed', 'In Manufacturing', 'Ready to Dispatch')
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

export async function getReorderCandidates() {
  const PAID_STATUSES = ['Delivered', 'Payment Confirmed', 'Ready to Dispatch', 'In Manufacturing'];
  return await sql`
    WITH paid_orders AS (
      SELECT o.id, o.customer_id, o.order_date
      FROM orders o
      WHERE o.status = ANY(${PAID_STATUSES})
    ),
    -- Most recent paid order per customer + bar-equivalent soap count
    last_order AS (
      SELECT DISTINCT ON (po.customer_id)
        po.customer_id,
        po.id          AS order_id,
        po.order_date  AS last_order_date,
        SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END)
          OVER (PARTITION BY po.id) AS bar_equiv_soaps,
        STRING_AGG(p.name, ', ' ORDER BY p.name)
          OVER (PARTITION BY po.id) AS products_ordered
      FROM paid_orders po
      JOIN order_items oi ON oi.order_id = po.id
      JOIN products p     ON p.id = oi.product_id
      ORDER BY po.customer_id, po.order_date DESC
    ),
    -- For repeat customers, compute their avg days between orders
    order_gaps AS (
      SELECT
        po.customer_id,
        AVG(po.order_date - LAG(po.order_date) OVER (PARTITION BY po.customer_id ORDER BY po.order_date)) AS avg_gap_days,
        COUNT(*) AS order_count
      FROM paid_orders po
      GROUP BY po.customer_id
    ),
    candidates AS (
      SELECT
        lo.customer_id,
        lo.last_order_date,
        lo.bar_equiv_soaps,
        lo.products_ordered,
        -- Expected days until reorder: soap-based (30 days/bar) vs repeat-customer avg, use whichever is smaller
        CASE
          WHEN og.order_count >= 2 AND og.avg_gap_days IS NOT NULL
            THEN LEAST(ROUND(lo.bar_equiv_soaps * 30), ROUND(og.avg_gap_days))
          ELSE ROUND(lo.bar_equiv_soaps * 30)
        END AS expected_days,
        (CURRENT_DATE - lo.last_order_date::date) AS days_since_order
      FROM last_order lo
      JOIN order_gaps og ON og.customer_id = lo.customer_id
    )
    SELECT
      c.id,
      c.name,
      c.phone,
      ca.last_order_date,
      ca.days_since_order,
      ca.bar_equiv_soaps,
      ca.expected_days,
      ca.products_ordered,
      (ca.days_since_order - ca.expected_days) AS days_overdue
    FROM candidates ca
    JOIN customers c ON c.id = ca.customer_id
    WHERE
      ca.days_since_order >= ca.expected_days          -- soap supply should be finished
      AND ca.days_since_order <= ca.expected_days * 3  -- not so long they've churned
    ORDER BY days_overdue DESC
  `;
}

export async function deleteCustomer(id) {
  // Check if they have orders first
  const orderCountResult = await sql`SELECT COUNT(*) as count FROM orders WHERE customer_id = ${id}`;
  if (parseInt(orderCountResult[0].count) > 0) {
    throw new Error('Customer has orders and cannot be deleted.');
  }

  return await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`;
}
