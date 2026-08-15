import sql from '@/lib/db';
import { normaliseToE164 } from '@/lib/utils/phone';

export async function getAllCustomers() {
  return await sql`
    SELECT c.*, COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o
      ON o.customer_id = c.id
     AND o.source IS DISTINCT FROM 'Expression of Interest'
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
    last_order_info AS (
      SELECT DISTINCT ON (po.customer_id)
        po.customer_id,
        po.id         AS order_id,
        po.order_date AS last_order_date
      FROM paid_orders po
      ORDER BY po.customer_id, po.order_date DESC
    ),
    last_order_soaps AS (
      SELECT
        lo.customer_id,
        lo.last_order_date,
        SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END) AS bar_equiv_soaps,
        STRING_AGG(p.name, ', ') AS products_ordered
      FROM last_order_info lo
      JOIN order_items oi ON oi.order_id = lo.order_id
      JOIN products p     ON p.id = oi.product_id
      GROUP BY lo.customer_id, lo.last_order_date
    ),
    order_gaps_raw AS (
      SELECT
        po.customer_id,
        po.order_date - LAG(po.order_date) OVER (PARTITION BY po.customer_id ORDER BY po.order_date) AS gap_days
      FROM paid_orders po
    ),
    order_gaps AS (
      SELECT customer_id, AVG(gap_days) AS avg_gap_days
      FROM order_gaps_raw
      WHERE gap_days IS NOT NULL
      GROUP BY customer_id
    ),
    candidates AS (
      SELECT
        los.customer_id,
        los.last_order_date,
        los.bar_equiv_soaps,
        los.products_ordered,
        CASE
          WHEN og.avg_gap_days IS NOT NULL
            THEN LEAST(ROUND(los.bar_equiv_soaps * 30), ROUND(og.avg_gap_days))
          ELSE ROUND(los.bar_equiv_soaps * 30)
        END AS expected_days,
        (CURRENT_DATE - los.last_order_date::date) AS days_since_order
      FROM last_order_soaps los
      LEFT JOIN order_gaps og ON og.customer_id = los.customer_id
    ),
    -- Latest outreach log entry per customer
    latest_outreach AS (
      SELECT DISTINCT ON (customer_id)
        customer_id,
        outreach_date   AS last_outreach_date,
        response        AS last_response,
        follow_up_date
      FROM outreach_log
      ORDER BY customer_id, created_at DESC
    ),
    -- Full outreach history per customer (for card timeline)
    outreach_history AS (
      SELECT
        customer_id,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',             id,
            'outreach_date',  outreach_date,
            'response',       response,
            'follow_up_date', follow_up_date,
            'notes',          notes
          ) ORDER BY created_at DESC
        ) AS history
      FROM outreach_log
      GROUP BY customer_id
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
      (ca.days_since_order - ca.expected_days)   AS days_overdue,
      lo.last_outreach_date,
      lo.last_response,
      lo.follow_up_date,
      COALESCE(oh.history, '[]'::json)            AS outreach_history,
      -- is_follow_up: had outreach, follow_up_date has passed
      CASE WHEN lo.follow_up_date IS NOT NULL AND lo.follow_up_date <= CURRENT_DATE THEN true ELSE false END AS is_follow_up
    FROM candidates ca
    JOIN customers c ON c.id = ca.customer_id
    LEFT JOIN latest_outreach lo ON lo.customer_id = ca.customer_id
    LEFT JOIN outreach_history oh ON oh.customer_id = ca.customer_id
    WHERE
      ca.days_since_order >= ca.expected_days
      AND ca.days_since_order <= ca.expected_days * 3
      -- Suppress if there's a future follow-up date scheduled
      AND (lo.follow_up_date IS NULL OR lo.follow_up_date <= CURRENT_DATE)
    ORDER BY days_overdue DESC
  `;
}

export async function getScheduledFollowUps() {
  return await sql`
    SELECT
      c.id,
      c.name,
      c.phone,
      ol.outreach_date  AS last_outreach_date,
      ol.response       AS last_response,
      ol.follow_up_date,
      ol.notes,
      COALESCE(oh.history, '[]'::json) AS outreach_history
    FROM (
      SELECT DISTINCT ON (customer_id)
        customer_id, outreach_date, response, follow_up_date, notes
      FROM outreach_log
      WHERE follow_up_date > CURRENT_DATE
        AND response IN ('pending', 'not_ready')
      ORDER BY customer_id, created_at DESC
    ) ol
    JOIN customers c ON c.id = ol.customer_id
    LEFT JOIN (
      SELECT customer_id,
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', id, 'outreach_date', outreach_date,
          'response', response, 'follow_up_date', follow_up_date, 'notes', notes
        ) ORDER BY created_at DESC) AS history
      FROM outreach_log
      GROUP BY customer_id
    ) oh ON oh.customer_id = ol.customer_id
    ORDER BY ol.follow_up_date ASC
  `;
}

export async function getReferralCandidates() {
  const PAID_STATUSES = ['Delivered', 'Payment Confirmed', 'Ready to Dispatch', 'In Manufacturing'];
  return await sql`
    WITH paid_orders AS (
      SELECT o.id, o.customer_id, o.order_date
      FROM orders o
      WHERE o.status = ANY(${PAID_STATUSES})
    ),
    last_order_info AS (
      SELECT DISTINCT ON (po.customer_id)
        po.customer_id,
        po.id         AS order_id,
        po.order_date AS last_order_date
      FROM paid_orders po
      ORDER BY po.customer_id, po.order_date DESC
    ),
    last_order_soaps AS (
      SELECT
        lo.customer_id,
        lo.last_order_date,
        SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END) AS bar_equiv_soaps,
        STRING_AGG(p.name, ', ') AS products_ordered
      FROM last_order_info lo
      JOIN order_items oi ON oi.order_id = lo.order_id
      JOIN products p     ON p.id = oi.product_id
      GROUP BY lo.customer_id, lo.last_order_date
    ),
    candidates AS (
      SELECT
        los.customer_id,
        los.last_order_date,
        los.bar_equiv_soaps,
        los.products_ordered,
        ROUND(los.bar_equiv_soaps * 30) AS expected_days,
        (CURRENT_DATE - los.last_order_date::date) AS days_since_order
      FROM last_order_soaps los
    ),
    -- Latest referral outreach per customer
    latest_referral AS (
      SELECT DISTINCT ON (customer_id)
        customer_id,
        outreach_date AS last_referral_date
      FROM outreach_log
      WHERE outreach_type = 'referral'
      ORDER BY customer_id, created_at DESC
    ),
    outreach_history AS (
      SELECT
        customer_id,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id',             id,
            'outreach_date',  outreach_date,
            'response',       response,
            'follow_up_date', follow_up_date,
            'notes',          notes,
            'outreach_type',  outreach_type
          ) ORDER BY created_at DESC
        ) AS history
      FROM outreach_log
      GROUP BY customer_id
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
      COALESCE(oh.history, '[]'::json) AS outreach_history,
      lr.last_referral_date
    FROM candidates ca
    JOIN customers c ON c.id = ca.customer_id
    LEFT JOIN latest_referral lr ON lr.customer_id = ca.customer_id
    LEFT JOIN outreach_history oh ON oh.customer_id = ca.customer_id
    WHERE
      -- In mid-cycle: at least 14 days in but not yet due for reorder
      ca.days_since_order >= 14
      AND ca.days_since_order < ca.expected_days
      -- Haven't been asked for a referral before (or it's been 60+ days)
      AND (lr.last_referral_date IS NULL OR lr.last_referral_date < CURRENT_DATE - INTERVAL '60 days')
    ORDER BY ca.days_since_order DESC
  `;
}

export async function logOutreach(customerId, type = 'reorder') {
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 7);
  const followUpStr = followUpDate.toISOString().split('T')[0];
  await sql`
    INSERT INTO outreach_log (customer_id, response, follow_up_date, outreach_type)
    VALUES (${customerId}, 'pending', ${followUpStr}, ${type})
  `;
}

export async function markNotReady(customerId, followUpDate) {
  // Update the most recent log entry for this customer
  await sql`
    UPDATE outreach_log
    SET response = 'not_ready', follow_up_date = ${followUpDate}
    WHERE id = (
      SELECT id FROM outreach_log
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
      LIMIT 1
    )
  `;
}

export async function markOrdered(customerId) {
  await sql`
    UPDATE outreach_log
    SET response = 'ordered'
    WHERE id = (
      SELECT id FROM outreach_log
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
      LIMIT 1
    )
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
