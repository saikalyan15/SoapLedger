'use server';

import sql from '@/lib/db';
import { PAID_STATUSES, PENDING_STATUSES } from './constants';

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
      SELECT
        CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END AS quantity,
        o.status
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE
        (${from}::date IS NULL OR o.order_date >= ${from}::date)
        AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
        AND o.status != 'Cancelled'
    )
    SELECT 
      COALESCE(SUM(order_value) FILTER (WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')), 0) as total_revenue,
      COUNT(*) as orders_count,
      COALESCE(ROUND(AVG(order_value), 1), 0) as avg_order_value,
      COALESCE(SUM(order_value) FILTER (WHERE status = ANY(${PENDING_STATUSES})), 0) as pending_revenue,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')), 0) as total_soaps_sold,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status = ANY(${PENDING_STATUSES})), 0) as pending_soaps
    FROM period_orders
  `;

  const costStats = await sql`
    WITH period_expenses AS (
      SELECT
        COALESCE(SUM(e.amount), 0) as total_all,
        COALESCE(SUM(e.amount) FILTER (WHERE ec.type = 'recurring'), 0) as total_recurring
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE (${from}::date IS NULL OR e.expense_date >= ${from}::date)
      AND (${to}::date IS NULL OR e.expense_date <= ${to}::date)
    ),
    period_sales AS (
      SELECT COALESCE(SUM(
        CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END
      ), 0) as soaps_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      AND (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    )
    SELECT
      total_all,
      CASE WHEN soaps_sold > 0 THEN total_recurring / soaps_sold ELSE 0 END as cost_price_per_soap
    FROM period_expenses, period_sales
  `;

  const s = stats[0] || {};
  const c = costStats[0] || {};
  const totalRevenue = parseFloat(s.total_revenue || 0);
  const totalExpenses = parseFloat(c.total_all || 0);

  return {
    total_revenue: totalRevenue,
    orders_count: parseInt(s.orders_count || 0),
    avg_order_value: parseFloat(s.avg_order_value || 0),
    pending_revenue: parseFloat(s.pending_revenue || 0),
    total_soaps_sold: Math.round(parseFloat(s.total_soaps_sold || 0)),
    pending_soaps: Math.round(parseFloat(s.pending_soaps || 0)),
    cost_price_per_soap: parseFloat(c.cost_price_per_soap || 0),
    total_expenses: totalExpenses,
    profit_loss: totalRevenue - totalExpenses,
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
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
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
        SUM((
          SELECT SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END)
          FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = o.id
        )) as soaps_sold
      FROM orders o
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
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
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND (${from}::date IS NULL OR order_date >= ${from}::date)
        AND (${to}::date IS NULL OR order_date <= ${to}::date)
      GROUP BY customer_id
    ),
    intervals AS (
      SELECT 
        customer_id,
        order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as diff
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
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
    WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
    ) o
    WHERE 
    (${from}::date IS NULL OR order_date >= ${from}::date)
    AND (${to}::date IS NULL OR order_date <= ${to}::date)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC  `;

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
    WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
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
    WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
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
    WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      AND (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
  return result.map(r => ({
    ...r,
    avg_order_value: parseFloat(r.avg_order_value)
  }));
}

export async function getMonthlyOrderTrend({ from, to }) {
  const result = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') as month,
      COUNT(*)::integer as order_count,
      SUM(order_value)::numeric as total_order_value,
      ROUND(AVG(order_value), 1)::numeric as avg_order_value,
      DATE_TRUNC('month', order_date) as sort_month
    FROM orders
    WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      AND (${from}::date IS NULL OR order_date >= ${from}::date)
      AND (${to}::date IS NULL OR order_date <= ${to}::date)
    GROUP BY sort_month, month
    ORDER BY sort_month ASC
  `;
  return result.map(r => ({
    ...r,
    order_count: parseInt(r.order_count),
    total_order_value: parseFloat(r.total_order_value),
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
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
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

  if (history.length === 0) return { data: [], currentRunRate: 0, gapToClose: 0 };

  const now = new Date();
  const firstOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const actualData = history.filter(m => new Date(m.month_date) <= firstOfCurrentMonth);
  const completeMonths = history.filter(m => new Date(m.month_date) < firstOfCurrentMonth);

  if (completeMonths.length === 0) return { data: [], currentRunRate: 0, gapToClose: 0 };

  const lastCompleteMonth = completeMonths[completeMonths.length - 1];

  // 1. If current month has data, extrapolate it to get the live run rate
  const currentMonthEntry = actualData.find(m => {
    const d = new Date(m.month_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  let currentRunRate;
  let runRateNote;

  if (currentMonthEntry && parseFloat(currentMonthEntry.revenue) > 0) {
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    currentRunRate = parseFloat(currentMonthEntry.revenue) * (daysInMonth / dayOfMonth);
    runRateNote = `Extrapolated from ${currentMonthEntry.month.split(' ')[0]} (day ${dayOfMonth}/${daysInMonth})`;
  } else {
    currentRunRate = parseFloat(lastCompleteMonth.revenue);
    runRateNote = `Revenue in ${lastCompleteMonth.month.split(' ')[0]}`;
  }

  // 2. Recurring cost run rate = average of last 3 COMPLETE months
  const completeRecurring = completeMonths.slice(-3);
  const avgMonthlyRecurringCost = completeRecurring.reduce(
    (sum, m) => sum + parseFloat(m.recurring_spend), 0
  ) / Math.min(completeRecurring.length, 3);

  // 3. Gap to close = cumulative expenses to date - cumulative revenue to date
  let totalCumulativeRevenue = 0;
  let totalCumulativeExpenses = 0;
  history.forEach(m => {
    totalCumulativeRevenue += parseFloat(m.revenue);
    totalCumulativeExpenses += parseFloat(m.recurring_spend) + parseFloat(m.one_time_spend);
  });
  const gapToClose = totalCumulativeExpenses - totalCumulativeRevenue;

  // 4. Monthly contribution
  const monthlyContribution = currentRunRate - avgMonthlyRecurringCost;

  // 5. Break-even month
  let flatBreakEvenMonth = "Never";
  if (monthlyContribution > 0) {
    const monthsAtFlatRate = Math.ceil(gapToClose / monthlyContribution);
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + monthsAtFlatRate);
    flatBreakEvenMonth = targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  // Generate chart data
  const data = [];
  let cumRevenue = 0;
  let cumExpenses = 0;

  actualData.forEach(m => {
    const rev = parseFloat(m.revenue);
    const exp = parseFloat(m.recurring_spend) + parseFloat(m.one_time_spend);
    cumRevenue += rev;
    cumExpenses += exp;
    data.push({
      month: m.month,
      cumRevenue,
      cumExpenses,
      isProjected: false,
      month_date: m.month_date
    });
  });

  // Projection starts from end of current month (not last complete month)
  let projectionDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let breakEvenFound = cumRevenue >= cumExpenses;

  for (let i = 1; i <= 24; i++) {
    projectionDate.setMonth(projectionDate.getMonth() + 1);
    
    cumRevenue += currentRunRate;
    cumExpenses += avgMonthlyRecurringCost;

    data.push({
      month: projectionDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      cumRevenue,
      cumExpenses,
      isProjected: true,
      month_date: new Date(projectionDate)
    });

    if (!breakEvenFound && cumRevenue >= cumExpenses) breakEvenFound = true;
    // Show a few months past break-even or at least 12 months
    if (breakEvenFound && i > 6) break;
  }

  return {
    data,
    currentRunRate,
    runRateNote,
    avgMonthlyRecurringCost,
    gapToClose,
    monthlyContribution,
    flatBreakEvenMonth
  };
}


export async function getMonthlyProductionData({ from, to } = {}) {
  const actualData = await sql`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon YYYY') as month,
      TO_CHAR(DATE_TRUNC('month', o.order_date), 'YYYY-MM') as month_key,
      COALESCE(SUM(oi.quantity), 0)::integer as soaps,
      COALESCE(SUM(o.order_value), 0)::numeric as revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
    GROUP BY DATE_TRUNC('month', o.order_date)
    ORDER BY DATE_TRUNC('month', o.order_date) ASC
  `;

  const capacityRow = await sql`
    SELECT value FROM settings WHERE key = 'monthly_capacity'
  `;
  const monthlyCapacity = parseInt(capacityRow[0]?.value || 30);

  return {
    actualData: actualData.map(r => ({
      ...r,
      soaps: parseInt(r.soaps),
      revenue: parseFloat(r.revenue)
    })),
    monthlyCapacity
  };
}

export async function getMonthlySurplusDeficit() {
  return await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', month_date), 'Mon YYYY') as month,
      COALESCE(monthly_revenue, 0) as revenue,
      COALESCE(monthly_recurring, 0) as recurring_costs,
      COALESCE(monthly_revenue, 0) - COALESCE(monthly_recurring, 0) as surplus_deficit,
      COALESCE(soaps_shipped, 0)::integer as soaps_shipped
    FROM (
      SELECT generate_series(DATE_TRUNC('month', '2025-11-01'::date),
        DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) as month_date
    ) months
    LEFT JOIN (
      SELECT DATE_TRUNC('month', order_date) as order_month, SUM(order_value) as monthly_revenue
      FROM orders WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      GROUP BY order_month
    ) rev ON rev.order_month = months.month_date
    LEFT JOIN (
      SELECT DATE_TRUNC('month', expense_date) as expense_month, SUM(e.amount) as monthly_recurring
      FROM expenses e JOIN expense_categories ec ON ec.id = e.category_id
      WHERE ec.include_in_cost_price = true GROUP BY expense_month
    ) exp ON exp.expense_month = months.month_date
    LEFT JOIN (
      SELECT DATE_TRUNC('month', o.order_date) as order_month, SUM(oi.quantity) as soaps_shipped
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      GROUP BY DATE_TRUNC('month', o.order_date)
    ) soaps ON soaps.order_month = months.month_date
    ORDER BY month_date ASC
  `;
}
