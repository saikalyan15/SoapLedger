'use server';

import sql from '@/lib/db';

export async function getRevenueKPIs({ from, to }) {
  // Use CTEs to get clean stats without join-duplication affecting averages/sums
  const stats = await sql`
    WITH period_orders AS (
      SELECT id, status, order_value
      FROM orders
      WHERE 
        (${from}::date IS NULL OR order_date >= ${from}::date)
        AND (${to}::date IS NULL OR order_date <= ${to}::date)
    ),
    period_items AS (
      SELECT oi.quantity, o.status
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE 
        (${from}::date IS NULL OR o.order_date >= ${from}::date)
        AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    )
    SELECT 
      COALESCE(SUM(order_value) FILTER (WHERE status IN ('Dispatched', 'Delivered')), 0) as total_revenue,
      COUNT(*) as orders_count,
      COALESCE(ROUND(AVG(order_value), 1), 0) as avg_order_value,
      COALESCE(SUM(order_value) FILTER (WHERE status IN ('Received', 'Payment Confirmed', 'In Production')), 0) as pending_revenue,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status IN ('Dispatched', 'Delivered')), 0) as total_soaps_sold,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status IN ('Received', 'Payment Confirmed', 'In Production')), 0) as pending_soaps
    FROM period_orders
  `;

  // Cost price per soap for the period
  const costStats = await sql`
    WITH period_expenses AS (
      SELECT COALESCE(SUM(e.amount), 0) as total_recurring
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE ec.type = 'recurring' 
      AND (${from}::date IS NULL OR e.expense_date >= ${from}::date)
      AND (${to}::date IS NULL OR e.expense_date <= ${to}::date)
    ),
    period_sales AS (
      SELECT COALESCE(SUM(oi.quantity), 0) as soaps_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('Delivered', 'Dispatched') 
      AND (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    )
    SELECT 
      CASE WHEN soaps_sold > 0 THEN total_recurring / soaps_sold ELSE 0 END as cost_price_per_soap
    FROM period_expenses, period_sales
  `;

  const s = stats[0] || {};

  return {
    total_revenue: parseFloat(s.total_revenue || 0),
    orders_count: parseInt(s.orders_count || 0),
    avg_order_value: parseFloat(s.avg_order_value || 0),
    pending_revenue: parseFloat(s.pending_revenue || 0),
    total_soaps_sold: parseInt(s.total_soaps_sold || 0),
    pending_soaps: parseInt(s.pending_soaps || 0),
    cost_price_per_soap: parseFloat(costStats[0]?.cost_price_per_soap || 0),
    revenue_trend: 0,
    aov_trend: 0,
    this_month_count: parseInt(s.orders_count || 0)
  };
}

export async function getMonthlyRevenue({ from, to }) {
  return await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      SUM(order_value) as revenue,
      COUNT(*) as order_count,
      DATE_TRUNC('month', order_date) as sort_month
    FROM orders
    WHERE 
      (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
}

export async function getCostPriceTrend({ from, to }) {
  // This query calculates CUMULATIVE costs vs sales volume to show economy of scale
  return await sql`
    WITH monthly_raw AS (
      SELECT 
        DATE_TRUNC('month', s.month_date) as month_date,
        COALESCE(s.soaps_sold, 0) as soaps_sold,
        COALESCE(s.revenue, 0) as revenue,
        COALESCE(e.recurring_spend, 0) as recurring_spend
      FROM (
        -- Generate all months between from/to or use actual sales months
        SELECT 
          DATE_TRUNC('month', o.order_date) as month_date,
          SUM(oi.quantity) as soaps_sold,
          SUM(oi.quantity * oi.unit_price) as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status IN ('Delivered', 'Dispatched')
        GROUP BY 1
      ) s
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('month', e.expense_date) as month_date,
          SUM(e.amount) as recurring_spend
        FROM expenses e
        JOIN expense_categories ec ON ec.id = e.category_id
        WHERE ec.type = 'recurring'
        GROUP BY 1
      ) e ON e.month_date = s.month_date
    ),
    cumulative_calc AS (
      SELECT 
        month_date,
        soaps_sold,
        revenue,
        SUM(recurring_spend) OVER (ORDER BY month_date) as cum_spend,
        SUM(soaps_sold) OVER (ORDER BY month_date) as cum_soaps
      FROM monthly_raw
    )
    SELECT 
      TO_CHAR(month_date, 'Mon YYYY') as month,
      soaps_sold,
      CASE WHEN soaps_sold > 0 THEN (revenue / soaps_sold) ELSE 0 END as avg_selling_price,
      CASE WHEN cum_soaps > 0 THEN (cum_spend / cum_soaps) ELSE 0 END as cost_price_per_soap,
      month_date as sort_month
    FROM cumulative_calc
    WHERE soaps_sold > 0
    ORDER BY sort_month ASC
  `;
}

export async function getRepeatCustomerRate({ from, to }) {
  const stats = await sql`
    WITH customer_stats AS (
      SELECT 
        customer_id, 
        COUNT(*) as order_count 
      FROM orders 
      WHERE 
        (${from}::date IS NULL OR order_date >= ${from}::date)
        AND (${to}::date IS NULL OR order_date <= ${to}::date)
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
    WHERE 
      (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
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
  const topProducts = await sql`
    SELECT 
      p.name, 
      p.base_type, 
      SUM(oi.quantity) as units_sold, 
      SUM(oi.quantity * oi.unit_price) as revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE 
      (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
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
    WHERE 
      (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    GROUP BY p.base_type
    ORDER BY revenue DESC
  `;

  return {
    top_products: topProducts,
    revenue_by_base: revenueByBase
  };
}

export async function getOperationsMetrics({ from, to }) {
  const stats = await sql`
    SELECT 
      AVG(dispatched_at - order_date) as avg_processing_days,
      AVG(delivered_at - dispatched_at) as avg_dispatch_to_delivery
    FROM orders
    WHERE 
      (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
      AND dispatched_at IS NOT NULL
  `;

  const soapsPerBatch = await sql`
    SELECT 
      AVG(total_units) as avg_soaps_per_batch
    FROM (
      SELECT 
        dispatched_at, 
        SUM(quantity) as total_units
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE dispatched_at IS NOT NULL 
      AND (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
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
    avg_processing_days: stats[0]?.avg_processing_days,
    avg_dispatch_to_delivery: stats[0]?.avg_dispatch_to_delivery,
    avg_soaps_per_batch: soapsPerBatch[0]?.avg_soaps_per_batch,
    aging_orders: agingOrders
  };
}

export async function getAvgOrderValueTrend({ from, to }) {
  return await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      ROUND(AVG(order_value), 1) as avg_order_value,
      COUNT(*) as order_count,
      DATE_TRUNC('month', order_date) as sort_month
    FROM orders
    WHERE 
      (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
}
