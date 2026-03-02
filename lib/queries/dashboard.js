'use server';

import sql from '@/lib/db';

export async function getRevenueKPIs({ from, to }) {
  const stats = await sql`
    WITH period_orders AS (
      SELECT id, status, order_value
      FROM orders
      WHERE 
        (${from}::date IS NULL OR order_date >= ${from}::date)
        AND (${to}::date IS NULL OR order_date <= ${to}::date)
        AND status != 'Cancelled'
    ),
    period_items AS (
      SELECT oi.quantity, o.status
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE 
        (${from}::date IS NULL OR o.order_date >= ${from}::date)
        AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
        AND o.status != 'Cancelled'
    )
    SELECT 
      COALESCE(SUM(order_value) FILTER (WHERE status IN ('Dispatched', 'Delivered')), 0) as total_revenue,
      COUNT(*) as orders_count,
      COALESCE(ROUND(AVG(order_value), 1), 0) as avg_order_value,
      COALESCE(SUM(order_value) FILTER (WHERE status NOT IN ('Dispatched', 'Delivered')), 0) as pending_revenue,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status IN ('Dispatched', 'Delivered')), 0) as total_soaps_sold,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status NOT IN ('Dispatched', 'Delivered')), 0) as pending_soaps
    FROM period_orders
  `;

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
    this_month_count: parseInt(s.orders_count || 0)
  };
}

export async function getCashFlowTrend({ from, to }) {
  return await sql`
    WITH monthly_revenue AS (
      SELECT 
        DATE_TRUNC('month', order_date) as month_date,
        SUM(order_value) as revenue
      FROM orders
      WHERE status IN ('Dispatched', 'Delivered')
      AND (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
      GROUP BY 1
    ),
    monthly_expenses AS (
      SELECT 
        DATE_TRUNC('month', e.expense_date) as month_date,
        SUM(e.amount) FILTER (WHERE ec.type = 'recurring' OR ec.type IS NULL) as recurring_spend,
        SUM(e.amount) FILTER (WHERE ec.type = 'one_time') as one_time_spend,
        SUM(e.amount) as total_spend
      FROM expenses e
      LEFT JOIN expense_categories ec ON ec.id = e.category_id
      WHERE (${from}::date IS NULL OR e.expense_date >= ${from}::date)
      AND (${to}::date IS NULL OR e.expense_date <= ${to}::date)
      GROUP BY 1
    ),
    all_months AS (
      SELECT month_date FROM monthly_revenue
      UNION
      SELECT month_date FROM monthly_expenses
    )
    SELECT 
      TO_CHAR(m.month_date, 'Mon YYYY') as month,
      COALESCE(r.revenue, 0) as revenue,
      COALESCE(e.recurring_spend, 0) as recurring_spend,
      COALESCE(NULLIF(e.one_time_spend, 0), NULL) as one_time_spend,
      COALESCE(e.total_spend, 0) as total_spend,
      COALESCE(r.revenue, 0) - COALESCE(e.total_spend, 0) as net_cash_flow,
      m.month_date as sort_month
    FROM all_months m
    LEFT JOIN monthly_revenue r ON r.month_date = m.month_date
    LEFT JOIN monthly_expenses e ON e.month_date = m.month_date
    ORDER BY sort_month ASC
  `;
}

export async function getCostPriceTrend({ from, to }) {
  const result = await sql`
    WITH monthly_revenue AS (
      SELECT 
        DATE_TRUNC('month', o.order_date) as month_date,
        SUM(o.order_value) as revenue,
        SUM((SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id)) as soaps_sold
      FROM orders o
      WHERE o.status IN ('Delivered', 'Dispatched')
      AND DATE_TRUNC('month', o.order_date) < DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY 1
    ),
    monthly_expenses AS (
      SELECT 
        DATE_TRUNC('month', e.expense_date) as month_date,
        SUM(e.amount) as recurring_spend
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE ec.type = 'recurring'
      GROUP BY 1
    ),
    blended_raw AS (
      SELECT 
        r.month_date,
        r.soaps_sold,
        r.revenue,
        COALESCE(e.recurring_spend, 0) as recurring_spend
      FROM monthly_revenue r
      LEFT JOIN monthly_expenses e ON e.month_date = r.month_date
    ),
    cumulative_calc AS (
      SELECT 
        month_date,
        soaps_sold,
        revenue,
        SUM(recurring_spend) OVER (ORDER BY month_date) as cum_spend,
        SUM(soaps_sold) OVER (ORDER BY month_date) as cum_soaps
      FROM blended_raw
    )
    SELECT 
      TO_CHAR(month_date, 'Mon YYYY') as month,
      COALESCE(soaps_sold, 0) as soaps_sold,
      CASE WHEN soaps_sold > 0 THEN (revenue / soaps_sold) ELSE 0 END as avg_selling_price,
      CASE WHEN cum_soaps > 0 THEN (cum_spend / cum_soaps) ELSE 0 END as cost_price_per_soap,
      month_date as sort_month
    FROM cumulative_calc
    WHERE soaps_sold > 0
    ORDER BY sort_month ASC
  `;
  return result.map(r => ({
    ...r,
    soaps_sold: parseFloat(r.soaps_sold || 0),
    avg_selling_price: parseFloat(r.avg_selling_price || 0),
    cost_price_per_soap: parseFloat(r.cost_price_per_soap || 0)
  }));
}

export async function getRepeatCustomerRate({ from, to }) {
  const stats = await sql`
    WITH customer_stats AS (
      SELECT 
        customer_id, 
        COUNT(*) as order_count 
      FROM orders 
      WHERE status != 'Cancelled'
        AND (${from}::date IS NULL OR order_date >= ${from}::date)
        AND (${to}::date IS NULL OR order_date <= ${to}::date)
      GROUP BY customer_id
    ),
    intervals AS (
      SELECT 
        customer_id,
        order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as diff
      FROM orders
      WHERE status != 'Cancelled'
    )
    SELECT 
      COUNT(*) as total_customers,
      COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers,
      (SELECT AVG(diff) FROM intervals WHERE diff IS NOT NULL) as avg_reorder_days
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
      WHERE status != 'Cancelled'
    ) o
    WHERE 
      (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
      AND DATE_TRUNC('month', order_date) < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;

  return {
    total_customers: total,
    repeat_customers: repeat,
    repeat_rate: rate,
    avg_reorder_days: parseFloat(stats[0]?.avg_reorder_days || 0),
    new_vs_returning_by_month: monthlyTrend
  };
}

export async function getProductPerformance({ from, to }) {
  // Proportional Net Revenue allocation logic:
  // (line_item_total / order_subtotal) * order_value
  const topProducts = await sql`
    WITH order_subtotals AS (
      SELECT order_id, SUM(quantity * unit_price) as subtotal
      FROM order_items
      GROUP BY order_id
    )
    SELECT 
      p.name, 
      p.base_type, 
      SUM(oi.quantity) as units_sold, 
      SUM((oi.quantity * oi.unit_price / NULLIF(os.subtotal, 0)) * o.order_value) as revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    JOIN order_subtotals os ON os.order_id = o.id
    WHERE o.status IN ('Dispatched', 'Delivered')
      AND (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    GROUP BY p.name, p.base_type
    ORDER BY units_sold DESC
    LIMIT 5
  `;

  const revenueByBase = await sql`
    WITH order_subtotals AS (
      SELECT order_id, SUM(quantity * unit_price) as subtotal
      FROM order_items
      GROUP BY order_id
    )
    SELECT 
      p.base_type, 
      SUM((oi.quantity * oi.unit_price / NULLIF(os.subtotal, 0)) * o.order_value) as revenue,
      SUM(oi.quantity) as units_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    JOIN order_subtotals os ON os.order_id = o.id
    WHERE o.status IN ('Dispatched', 'Delivered')
      AND (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    GROUP BY p.base_type
    ORDER BY revenue DESC
  `;

  return {
    top_products: topProducts.map(r => ({
      ...r,
      units_sold: parseFloat(r.units_sold),
      revenue: parseFloat(r.revenue)
    })),
    revenue_by_base: revenueByBase.map(r => ({
      ...r,
      revenue: parseFloat(r.revenue),
      units_sold: parseFloat(r.units_sold)
    }))
  };
}

export async function getOperationsMetrics({ from, to }) {
  const stats = await sql`
    SELECT 
      AVG(dispatched_at::date - order_date) as avg_processing_days,
      AVG(delivered_at::date - dispatched_at::date) as avg_dispatch_to_delivery
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

  return {
    avg_processing_days: parseFloat(stats[0]?.avg_processing_days || 0),
    avg_dispatch_to_delivery: parseFloat(stats[0]?.avg_dispatch_to_delivery || 0),
    avg_soaps_per_batch: parseFloat(soapsPerBatch[0]?.avg_soaps_per_batch || 0)
  };
}

export async function getAvgOrderValueTrend({ from, to }) {
  const result = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      ROUND(AVG(order_value), 1) as avg_order_value,
      COUNT(*) as order_count,
      DATE_TRUNC('month', order_date) as sort_month
    FROM orders
    WHERE status != 'Cancelled'
      AND (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
      AND DATE_TRUNC('month', order_date) < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
  return result.map(r => ({
    ...r,
    avg_order_value: parseFloat(r.avg_order_value)
  }));
}

export async function getBreakEvenProjection() {
  const history = await sql`
    WITH monthly_revenue AS (
      SELECT 
        DATE_TRUNC('month', order_date) as month_date,
        SUM(order_value) as revenue
      FROM orders
      WHERE status IN ('Dispatched', 'Delivered')
      GROUP BY 1
    ),
    monthly_expenses AS (
      SELECT 
        DATE_TRUNC('month', e.expense_date) as month_date,
        SUM(e.amount) FILTER (WHERE ec.type = 'recurring' OR ec.type IS NULL) as recurring,
        SUM(e.amount) FILTER (WHERE ec.type = 'one_time') as one_time
      FROM expenses e
      LEFT JOIN expense_categories ec ON ec.id = e.category_id
      GROUP BY 1
    ),
    all_months AS (
      SELECT month_date FROM monthly_revenue
      UNION
      SELECT month_date FROM monthly_expenses
    )
    SELECT 
      m.month_date,
      TO_CHAR(m.month_date, 'Mon YYYY') as month,
      COALESCE(r.revenue, 0) as revenue,
      COALESCE(e.recurring, 0) as recurring_spend,
      COALESCE(e.one_time, 0) as one_time_spend
    FROM all_months m
    LEFT JOIN monthly_revenue r ON r.month_date = m.month_date
    LEFT JOIN monthly_expenses e ON e.month_date = m.month_date
    ORDER BY m.month_date ASC
  `;

  if (history.length === 0) return { data: [], rawGrowthRate: 0, cappedGrowthRate: 0, completeMonthsCount: 0 };

  const now = new Date();
  
  const complete = history.filter(m => {
    const d = new Date(m.month_date);
    return d < new Date(now.getFullYear(), now.getMonth(), 1)
      && parseFloat(m.revenue) > 0;
  });

  const completeMonthsCount = complete.length;

  let rawGrowthRate = 0.10;
  if (completeMonthsCount >= 2) {
    const changes = [];
    for (let i = 1; i < completeMonthsCount; i++) {
      const prev = parseFloat(complete[i - 1].revenue);
      const curr = parseFloat(complete[i].revenue);
      if (prev > 0) {
        changes.push((curr - prev) / prev);
      }
    }
    if (changes.length > 0) {
      rawGrowthRate = changes.reduce((a, b) => a + b, 0) / changes.length;
    }
  }
  
  const cappedGrowthRate = Math.max(0, Math.min(rawGrowthRate, 0.20));

  const completeRecurring = history.filter(m => {
    const d = new Date(m.month_date);
    return d < new Date(now.getFullYear(), now.getMonth(), 1);
  }).slice(-3);
  
  const avgMonthlyRecurringExpense = completeRecurring.reduce(
    (sum, m) => sum + parseFloat(m.recurring_spend), 0
  ) / Math.min(completeRecurring.length, 3);

  const data = [];
  let cumRevenue = 0;
  let cumExpenses = 0;
  
  const actualData = history.filter(m => {
    const d = new Date(m.month_date);
    return d < new Date(now.getFullYear(), now.getMonth(), 1);
  });

  actualData.forEach(m => {
    const rev = parseFloat(m.revenue);
    const exp = parseFloat(m.recurring_spend) + parseFloat(m.one_time_spend);
    cumRevenue += rev;
    cumExpenses += exp;
    data.push({
      month: m.month,
      cumRevenue,
      cumExpenses,
      cumRevenueUpper: cumRevenue,
      cumRevenueLower: cumRevenue,
      isProjected: false,
      month_date: m.month_date
    });
  });

  if (data.length === 0) return { data: [], rawGrowthRate, cappedGrowthRate, completeMonthsCount };

  let lastPoint = data[data.length - 1];
  let projectionDate = new Date(lastPoint.month_date);
  let breakEvenFound = cumRevenue >= cumExpenses;
  let lastActualRevenue = parseFloat(actualData[actualData.length - 1].revenue);
  let projectedMonthlyRevenue = lastActualRevenue;
  let projectedMonthlyRevenueUpper = lastActualRevenue;
  let projectedMonthlyRevenueLower = lastActualRevenue;

  for (let i = 1; i <= 18; i++) {
    projectionDate.setMonth(projectionDate.getMonth() + 1);
    
    projectedMonthlyRevenue = projectedMonthlyRevenue * (1 + cappedGrowthRate);
    projectedMonthlyRevenueUpper = projectedMonthlyRevenueUpper * (1 + cappedGrowthRate + 0.05);
    projectedMonthlyRevenueLower = projectedMonthlyRevenueLower * (1 + Math.max(0, cappedGrowthRate - 0.05));
    
    cumRevenue += projectedMonthlyRevenue;
    cumExpenses += avgMonthlyRecurringExpense;

    data.push({
      month: projectionDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      cumRevenue,
      cumExpenses,
      cumRevenueUpper: cumRevenue + (projectedMonthlyRevenueUpper - projectedMonthlyRevenue) * i,
      cumRevenueLower: Math.max(0, cumRevenue - (projectedMonthlyRevenue - projectedMonthlyRevenueLower) * i),
      isProjected: true,
      month_date: new Date(projectionDate)
    });

    if (!breakEvenFound && cumRevenue >= cumExpenses) breakEvenFound = true;
    if (breakEvenFound && i > 4) break;
  }

  return { data, rawGrowthRate, cappedGrowthRate, completeMonthsCount };
}
