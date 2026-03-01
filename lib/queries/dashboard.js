'use server';

import sql from '@/lib/db';

/**
 * Helper to get date filters for SQL
 */
function getDateFilter(from, to, column = 'order_date') {
  if (!from && !to) return sql``;
  if (from && to) return sql`AND ${sql(column)} BETWEEN ${from} AND ${to}`;
  if (from) return sql`AND ${sql(column)} >= ${from}`;
  if (to) return sql`AND ${sql(column)} <= ${to}`;
  return sql``;
}

export async function getRevenueKPIs({ from, to }) {
  const dateFilter = getDateFilter(from, to);
  
  // Current period stats
  const stats = await sql`
    SELECT 
      COALESCE(SUM(CASE WHEN status IN ('Dispatched', 'Delivered') THEN order_value ELSE 0 END), 0) as total_revenue,
      COUNT(*) as orders_count,
      COALESCE(ROUND(AVG(order_value), 1), 0) as avg_order_value,
      COALESCE(SUM(CASE WHEN status IN ('Received', 'Payment Confirmed', 'In Production') THEN order_value ELSE 0 END), 0) as pending_revenue
    FROM orders
    WHERE 1=1 ${dateFilter}
  `;

  return {
    ...stats[0],
    revenue_trend: 0,
    aov_trend: 0,
    this_month_count: stats[0].orders_count // simplified for now
  };
}

export async function getMonthlyRevenue({ from, to }) {
  const dateFilter = getDateFilter(from, to);
  
  return await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      SUM(order_value) as revenue,
      COUNT(*) as order_count,
      DATE_TRUNC('month', order_date) as sort_month
    FROM orders
    WHERE 1=1 ${dateFilter}
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
}

export async function getRepeatCustomerRate({ from, to }) {
  const dateFilter = getDateFilter(from, to);
  
  const stats = await sql`
    WITH customer_stats AS (
      SELECT 
        customer_id, 
        COUNT(*) as order_count 
      FROM orders 
      WHERE 1=1 ${dateFilter}
      GROUP BY customer_id
    )
    SELECT 
      COUNT(*) as total_customers,
      COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers
    FROM customer_stats
  `;

  const total = parseInt(stats[0].total_customers) || 0;
  const repeat = parseInt(stats[0].repeat_customers) || 0;
  const rate = total > 0 ? (repeat / total * 100) : 0;

  const monthlyTrend = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      COUNT(DISTINCT customer_id) FILTER (WHERE is_new) as new_customers,
      COUNT(DISTINCT customer_id) FILTER (WHERE NOT is_new) as returning_customers,
      DATE_TRUNC('month', order_date) as sort_month
    FROM (
      SELECT 
        customer_id, 
        order_date,
        (ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) = 1) as is_new
      FROM orders
    ) o
    WHERE 1=1 ${dateFilter}
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;

  return {
    total_customers: total,
    repeat_customers: repeat,
    repeat_rate: rate,
    new_vs_returning_by_month: monthlyTrend
  };
}

export async function getProductPerformance({ from, to }) {
  const dateFilter = getDateFilter(from, to, 'o.order_date');
  
  const topProducts = await sql`
    SELECT 
      p.name, 
      p.base_type, 
      SUM(oi.quantity) as units_sold, 
      SUM(oi.quantity * oi.unit_price) as revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE 1=1 ${dateFilter}
    GROUP BY p.name, p.base_type
    ORDER BY units_sold DESC
    LIMIT 5
  `;

  const revenueByBase = await sql`
    SELECT 
      p.base_type, 
      SUM(oi.quantity * oi.unit_price) as revenue,
      SUM(oi.quantity) as units_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE 1=1 ${dateFilter}
    GROUP BY p.base_type
    ORDER BY revenue DESC
  `;

  const allProductStats = await sql`
    SELECT 
      p.name, 
      p.base_type, 
      COALESCE(SUM(oi.quantity), 0) as units_sold, 
      COALESCE(SUM(oi.quantity * oi.unit_price), 0) as revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id ${dateFilter}
    WHERE p.is_active = true
    GROUP BY p.name, p.base_type
    ORDER BY units_sold DESC
  `;

  return {
    top_products: topProducts,
    revenue_by_base: revenueByBase,
    all_product_stats: allProductStats
  };
}

export async function getOperationsMetrics({ from, to }) {
  const dateFilter = getDateFilter(from, to, 'order_date');
  
  const stats = await sql`
    SELECT 
      ROUND(AVG(dispatched_at - order_date), 1) as avg_processing_days,
      ROUND(AVG(delivered_at - dispatched_at), 1) as avg_dispatch_to_delivery
    FROM orders
    WHERE 1=1 ${dateFilter}
    AND dispatched_at IS NOT NULL
  `;

  const soapsPerBatch = await sql`
    SELECT 
      ROUND(AVG(total_units), 1) as avg_soaps_per_batch
    FROM (
      SELECT 
        dispatched_at, 
        SUM(quantity) as total_units
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE dispatched_at IS NOT NULL ${dateFilter}
      GROUP BY dispatched_at
    ) batch_totals
  `;

  const agingOrders = await sql`
    SELECT 
      o.id, 
      c.name as customer_name, 
      o.status, 
      o.order_date, 
      (CURRENT_DATE - o.order_date) as days_waiting
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.status IN ('Received', 'Payment Confirmed')
    AND o.order_date < CURRENT_DATE - INTERVAL '3 days'
    ORDER BY days_waiting DESC
  `;

  return {
    avg_processing_days: stats[0]?.avg_processing_days || 0,
    avg_dispatch_to_delivery: stats[0]?.avg_dispatch_to_delivery || 0,
    avg_soaps_per_batch: soapsPerBatch[0]?.avg_soaps_per_batch || 0,
    aging_orders: agingOrders
  };
}

export async function getAvgOrderValueTrend({ from, to }) {
  const dateFilter = getDateFilter(from, to);
  
  return await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      ROUND(AVG(order_value), 1) as avg_order_value,
      COUNT(*) as order_count,
      DATE_TRUNC('month', order_date) as sort_month
    FROM orders
    WHERE 1=1 ${dateFilter}
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
}
