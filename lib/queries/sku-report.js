import sql from '@/lib/db';

export async function getSkuAllTime() {
  return await sql`
    SELECT
      p.id,
      p.name,
      p.base_type,
      p.unit_price,
      p.is_active,
      COALESCE(SUM(CASE WHEN o.status != 'Cancelled' AND o.source IS DISTINCT FROM 'Expression of Interest' THEN oi.quantity ELSE 0 END), 0)::int AS total_qty,
      COUNT(DISTINCT CASE WHEN o.status != 'Cancelled' AND o.source IS DISTINCT FROM 'Expression of Interest' THEN oi.order_id ELSE NULL END)::int AS total_orders,
      COALESCE(SUM(CASE WHEN o.status != 'Cancelled' AND o.source IS DISTINCT FROM 'Expression of Interest' THEN oi.quantity * oi.unit_price ELSE 0 END), 0)::numeric AS total_revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
    GROUP BY p.id, p.name, p.base_type, p.unit_price, p.is_active
    ORDER BY total_qty DESC, p.base_type, p.name
  `;
}

export async function getSkuMonthly() {
  return await sql`
    SELECT
      TO_CHAR(o.order_date, 'YYYY-MM') AS month,
      p.id AS product_id,
      p.name AS product_name,
      p.base_type,
      SUM(oi.quantity)::int AS qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status != 'Cancelled'
      AND o.source IS DISTINCT FROM 'Expression of Interest'
    GROUP BY TO_CHAR(o.order_date, 'YYYY-MM'), p.id, p.name, p.base_type
    ORDER BY month DESC, qty DESC
  `;
}
