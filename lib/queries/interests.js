import sql from '@/lib/db';

export async function getInterests() {
  return await sql`
    SELECT
      o.id,
      o.created_at,
      o.order_value AS estimated_value,
      o.interest_contact_channel,
      o.interest_consent_at,
      o.interest_contacted_at,
      c.name AS customer_name,
      c.phone AS customer_phone,
      COALESCE(
        string_agg(p.name || ' ×' || oi.quantity::text, ', ' ORDER BY p.name),
        'No products selected'
      ) AS products
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.source = 'Expression of Interest'
      AND o.status = 'Awaiting Payment'
    GROUP BY o.id, c.id
    ORDER BY o.interest_contacted_at NULLS FIRST, o.created_at DESC
  `;
}
