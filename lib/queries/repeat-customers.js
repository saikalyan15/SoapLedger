import sql from '@/lib/db';

export async function getRepeatCustomers() {
  return await sql`
    SELECT
      c.id,
      c.name,
      c.phone,
      COUNT(DISTINCT o.id) AS order_count,
      MAX(o.order_date) AS last_order_date,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'order_id', o.id,
          'order_date', o.order_date,
          'status', o.status,
          'items', (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'product_name', oid.product_name,
                'quantity', oid.quantity,
                'unit_price', oid.unit_price
              ) ORDER BY oid.product_name
            )
            FROM order_items_detail oid
            WHERE oid.order_id = o.id
          )
        ) ORDER BY o.order_date DESC
      ) AS orders
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    HAVING COUNT(DISTINCT o.id) > 1
    ORDER BY COUNT(DISTINCT o.id) DESC, MAX(o.order_date) DESC
  `;
}
