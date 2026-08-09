'use server';

import sql from '@/lib/db';
import { PENDING_STATUSES } from './constants';

export async function getRevenueKPIs({ from, to }) {
  const stats = await sql`
    WITH period_orders AS (
      SELECT id, status, order_value
      FROM orders
      WHERE 
        (${from}::date IS NULL OR order_date >= ${from}::date)
        AND (${to}::date IS NULL OR order_date <= ${to}::date)
        AND status != 'Cancelled'
        AND source IS DISTINCT FROM 'Expression of Interest'
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
        AND o.source IS DISTINCT FROM 'Expression of Interest'
    )
    SELECT 
      COALESCE(SUM(order_value) FILTER (WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')), 0) as total_revenue,
      COUNT(*) FILTER (WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')) as orders_count,
      COALESCE(ROUND(AVG(order_value) FILTER (WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')), 1), 0) as avg_order_value,
      COALESCE(SUM(order_value) FILTER (WHERE status = ANY(${PENDING_STATUSES})), 0) as pending_revenue,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')), 0) as total_soaps_sold,
      COALESCE((SELECT SUM(quantity) FROM period_items WHERE status = ANY(${PENDING_STATUSES})), 0) as pending_soaps
    FROM period_orders
  `;

  const costStats = await sql`
    SELECT COALESCE(SUM(e.amount), 0) as total_all
    FROM expenses e
    WHERE (${from}::date IS NULL OR e.expense_date >= ${from}::date)
      AND (${to}::date IS NULL OR e.expense_date <= ${to}::date)
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
    total_expenses: totalExpenses,
  };
}

export async function getCashFlowTrend({ from, to }) {
  const rows = await sql`
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

  return rows.map((row) => ({
    month: row.month,
    revenue: parseFloat(row.revenue || 0),
    recurring_spend: parseFloat(row.recurring_spend || 0),
    one_time_spend: row.one_time_spend == null ? 0 : parseFloat(row.one_time_spend),
    total_spend: parseFloat(row.total_spend || 0),
    net_cash_flow: parseFloat(row.net_cash_flow || 0),
  }));
}

// Unit economics use the owner's explicit category-level `include_in_cost_price`
// choices. A 90-day window smooths lumpy ingredient and packaging purchases
// while staying responsive to recent supplier prices. Operating profit uses all
// recurring expenses; one-time expenses are shown separately rather than being
// silently mixed into the normal cost of running the business.
export async function getUnitEconomics() {
  const [row] = await sql`
    WITH recorded_costs AS (
      SELECT
        COALESCE(SUM(e.amount) FILTER (WHERE ec.include_in_cost_price = TRUE), 0) AS included_spend,
        COALESCE(SUM(e.amount) FILTER (
          WHERE ec.include_in_cost_price = TRUE AND LOWER(ec.name) <> 'shipping'
        ), 0) AS production_spend,
        COALESCE(SUM(e.amount) FILTER (
          WHERE ec.include_in_cost_price = TRUE AND LOWER(ec.name) = 'shipping'
        ), 0) AS shipping_spend,
        COALESCE(SUM(e.amount) FILTER (WHERE ec.type = 'recurring'), 0) AS operating_spend,
        COALESCE(SUM(e.amount) FILTER (WHERE ec.type = 'one_time'), 0) AS one_time_spend,
        COALESCE(SUM(e.amount) FILTER (WHERE LOWER(ec.name) = 'labour'), 0) AS labour_spend
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.category_id
      WHERE e.expense_date >= CURRENT_DATE - INTERVAL '90 days'
    ),
    recognised_revenue AS (
      SELECT COALESCE(SUM(order_value), 0) AS revenue
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND order_date >= CURRENT_DATE - INTERVAL '90 days'
    ),
    equivalent_units AS (
      SELECT COALESCE(SUM(
        CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END
      ), 0) AS soaps
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'
    )
    SELECT
      included_spend,
      production_spend,
      shipping_spend,
      operating_spend,
      one_time_spend,
      labour_spend,
      revenue,
      soaps,
      CASE WHEN soaps > 0 THEN production_spend / soaps ELSE NULL END AS production_cost_per_soap,
      CASE WHEN soaps > 0 THEN shipping_spend / soaps ELSE NULL END AS shipping_cost_per_soap,
      CASE WHEN soaps > 0 THEN included_spend / soaps ELSE NULL END AS unit_cost,
      CASE WHEN soaps > 0 THEN revenue / soaps ELSE NULL END AS avg_selling_price,
      revenue - operating_spend AS operating_result,
      CASE WHEN soaps > 0 THEN operating_spend / soaps ELSE NULL END AS operating_cost_per_soap,
      CASE WHEN soaps > 0 THEN (revenue - operating_spend) / soaps ELSE NULL END AS operating_result_per_soap,
      CASE WHEN revenue > 0 THEN ((revenue - operating_spend) / revenue) * 100 ELSE NULL END AS operating_margin_pct
    FROM recorded_costs, recognised_revenue, equivalent_units
  `;

  const categories = await sql`
    SELECT name
    FROM expense_categories
    WHERE include_in_cost_price = TRUE
    ORDER BY name
  `;

  const unitCost = row?.unit_cost == null ? null : parseFloat(row.unit_cost);
  const avgSellingPrice = row?.avg_selling_price == null ? null : parseFloat(row.avg_selling_price);
  const operatingResult = parseFloat(row?.operating_result || 0);
  const operatingResultPerSoap = row?.operating_result_per_soap == null
    ? null
    : parseFloat(row.operating_result_per_soap);

  return {
    window_days: 90,
    included_spend: parseFloat(row?.included_spend || 0),
    production_spend: parseFloat(row?.production_spend || 0),
    shipping_spend: parseFloat(row?.shipping_spend || 0),
    operating_spend: parseFloat(row?.operating_spend || 0),
    one_time_spend: parseFloat(row?.one_time_spend || 0),
    labour_spend: parseFloat(row?.labour_spend || 0),
    recognised_revenue: parseFloat(row?.revenue || 0),
    equivalent_soaps: parseFloat(row?.soaps || 0),
    production_cost_per_soap: row?.production_cost_per_soap == null ? null : parseFloat(row.production_cost_per_soap),
    shipping_cost_per_soap: row?.shipping_cost_per_soap == null ? null : parseFloat(row.shipping_cost_per_soap),
    unit_cost: unitCost,
    avg_selling_price: avgSellingPrice,
    operating_result: operatingResult,
    operating_cost_per_soap: row?.operating_cost_per_soap == null ? null : parseFloat(row.operating_cost_per_soap),
    operating_result_per_soap: operatingResultPerSoap,
    operating_margin_pct: row?.operating_margin_pct == null ? null : parseFloat(row.operating_margin_pct),
    included_categories: categories.map(({ name }) => name),
  };
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
      SUM((oi.quantity * oi.unit_price / NULLIF(os.subtotal, 0)) * o.order_value) as revenue,
      -- Actual price charged (SUM(qty*unit_price)/SUM(qty)), separate from the
      -- net-of-shipping-and-discount "revenue" above — used for the "sells ₹X"
      -- display so it matches the real per-unit price instead of a blended
      -- order-level allocation that can drift from the catalog price.
      SUM(oi.quantity * oi.unit_price) as gross_revenue
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
      revenue: parseFloat(r.revenue),
      gross_revenue: parseFloat(r.gross_revenue)
    })),
    revenue_by_base: revenueByBase.map(r => ({
      ...r,
      revenue: parseFloat(r.revenue),
      units_sold: parseFloat(r.units_sold)
    }))
  };
}

export async function getMonthlyBaseRevenue({ from, to }) {
  // Same proportional net-revenue allocation as getProductPerformance,
  // grouped by month and base type for the stacked demand chart.
  const rows = await sql`
    WITH order_subtotals AS (
      SELECT order_id, SUM(quantity * unit_price) as subtotal
      FROM order_items
      GROUP BY order_id
    )
    SELECT
      TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon YYYY') as month,
      DATE_TRUNC('month', o.order_date) as sort_month,
      p.base_type,
      SUM((oi.quantity * oi.unit_price / NULLIF(os.subtotal, 0)) * o.order_value) as revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    JOIN order_subtotals os ON os.order_id = o.id
    WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      AND (${from}::date IS NULL OR o.order_date >= ${from}::date)
      AND (${to}::date IS NULL OR o.order_date <= ${to}::date)
    GROUP BY sort_month, month, p.base_type
    ORDER BY sort_month ASC
  `;

  const baseTotals = {};
  rows.forEach((r) => {
    baseTotals[r.base_type] = (baseTotals[r.base_type] || 0) + parseFloat(r.revenue || 0);
  });
  // Fixed stack order: largest lifetime earner at the bottom of every month's stack
  const base_types = Object.entries(baseTotals).sort((a, b) => b[1] - a[1]).map(([t]) => t);

  const monthMap = new Map();
  rows.forEach((r) => {
    if (!monthMap.has(r.month)) {
      const blank = { month: r.month };
      base_types.forEach((t) => { blank[t] = 0; });
      monthMap.set(r.month, blank);
    }
    monthMap.get(r.month)[r.base_type] = parseFloat(r.revenue || 0);
  });

  return { months: [...monthMap.values()], base_types };
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

  // 1. Recurring cost run rate = average of last 3 COMPLETE months
  const completeRecurring = completeMonths.slice(-3);
  const avgMonthlyRecurringCost = completeRecurring.reduce(
    (sum, m) => sum + parseFloat(m.recurring_spend), 0
  ) / Math.min(completeRecurring.length, 3);

  // Revenue projection = average of last 6 complete months
  const completeRevenueSample = completeMonths.slice(-6);
  const avgMonthlyRevenue = completeRevenueSample.reduce(
    (sum, m) => sum + parseFloat(m.revenue), 0
  ) / Math.min(completeRevenueSample.length, 6);

  // 2. Current run rate: only extrapolate if enough of the month has passed (≥7 days).
  //    On day 1–6, one stray order would multiply by 30x — meaningless noise.
  //    Fall back to 3-month average when extrapolation isn't trustworthy.
  const currentMonthEntry = actualData.find(m => {
    const d = new Date(m.month_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  let currentRunRate;
  let runRateNote;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (currentMonthEntry && parseFloat(currentMonthEntry.revenue) > 0 && dayOfMonth >= 7) {
    currentRunRate = parseFloat(currentMonthEntry.revenue) * (daysInMonth / dayOfMonth);
    runRateNote = `Extrapolated from ${currentMonthEntry.month.split(' ')[0]} (day ${dayOfMonth}/${daysInMonth})`;
  } else {
    currentRunRate = avgMonthlyRevenue;
    runRateNote = `6-month avg (${completeRevenueSample.length} months)`;
  }

  // 3. Gap to close = cumulative expenses to date - cumulative revenue to date
  let totalCumulativeRevenue = 0;
  let totalCumulativeExpenses = 0;
  history.forEach(m => {
    totalCumulativeRevenue += parseFloat(m.revenue);
    totalCumulativeExpenses += parseFloat(m.recurring_spend) + parseFloat(m.one_time_spend);
  });
  const gapToClose = totalCumulativeExpenses - totalCumulativeRevenue;

  // 4. Monthly contribution uses averaged revenue, not the potentially spike-inflated run rate
  const monthlyContribution = avgMonthlyRevenue - avgMonthlyRecurringCost;

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

    cumRevenue += avgMonthlyRevenue;
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
    avgMonthlyRevenue,
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
      WHERE ec.type = 'recurring' GROUP BY expense_month
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

export async function getThisMonthSnapshot() {
  // Revenue + orders queried directly from orders (no join) to avoid
  // order_value being multiplied once per line item.
  // Soaps require the items join, so they are fetched separately.
  const [thisRev, lastRev, lastPaceRev, thisSoaps, lastSoaps, lastPaceSoaps, thisExpenses, lastExpenses, lastPaceExpenses] = await Promise.all([
    sql`
      SELECT
        COALESCE(SUM(order_value), 0) as revenue,
        COUNT(*)                       as orders
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND order_date >= DATE_TRUNC('month', CURRENT_DATE)
    `,
    sql`
      SELECT
        COALESCE(SUM(order_value), 0) as revenue,
        COUNT(*)                       as orders
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND order_date  < DATE_TRUNC('month', CURRENT_DATE)
    `,
    sql`
      SELECT
        COALESCE(SUM(order_value), 0) as revenue,
        COUNT(*)                       as orders
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND order_date < LEAST(
          DATE_TRUNC('month', CURRENT_DATE),
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            + (EXTRACT(DAY FROM CURRENT_DATE)::integer * INTERVAL '1 day')
        )
    `,
    sql`
      SELECT COALESCE(SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END), 0) as soaps
      FROM order_items oi
      JOIN orders o  ON o.id  = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE)
    `,
    sql`
      SELECT COALESCE(SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END), 0) as soaps
      FROM order_items oi
      JOIN orders o  ON o.id  = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND o.order_date  < DATE_TRUNC('month', CURRENT_DATE)
    `,
    sql`
      SELECT COALESCE(SUM(CASE WHEN p.base_type = 'Travel' THEN oi.quantity / 5.0 ELSE oi.quantity END), 0) as soaps
      FROM order_items oi
      JOIN orders o  ON o.id  = oi.order_id
      JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND o.order_date < LEAST(
          DATE_TRUNC('month', CURRENT_DATE),
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            + (EXTRACT(DAY FROM CURRENT_DATE)::integer * INTERVAL '1 day')
        )
    `,
    sql`SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)`,
    sql`SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND expense_date < DATE_TRUNC('month', CURRENT_DATE)`,
    sql`
      SELECT COALESCE(SUM(amount), 0) as expenses
      FROM expenses
      WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND expense_date < LEAST(
          DATE_TRUNC('month', CURRENT_DATE),
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            + (EXTRACT(DAY FROM CURRENT_DATE)::integer * INTERVAL '1 day')
        )
    `,
  ]);

  return {
    this_month: {
      revenue:  parseFloat(thisRev[0].revenue),
      orders:   parseInt(thisRev[0].orders),
      soaps:    Math.round(parseFloat(thisSoaps[0].soaps)),
      expenses: parseFloat(thisExpenses[0].expenses),
    },
    last_month: {
      revenue:  parseFloat(lastRev[0].revenue),
      orders:   parseInt(lastRev[0].orders),
      soaps:    Math.round(parseFloat(lastSoaps[0].soaps)),
      expenses: parseFloat(lastExpenses[0].expenses),
    },
    last_month_same_period: {
      revenue: parseFloat(lastPaceRev[0].revenue),
      orders: parseInt(lastPaceRev[0].orders),
      soaps: Math.round(parseFloat(lastPaceSoaps[0].soaps)),
      expenses: parseFloat(lastPaceExpenses[0].expenses),
    },
  };
}

export async function getTopExpenseCategories({ from, to }) {
  const result = await sql`
    SELECT
      ec.name,
      ec.type,
      SUM(e.amount) as total
    FROM expenses e
    JOIN expense_categories ec ON ec.id = e.category_id
    WHERE (${from}::date IS NULL OR e.expense_date >= ${from}::date)
      AND (${to}::date IS NULL OR e.expense_date <= ${to}::date)
    GROUP BY ec.name, ec.type
    ORDER BY total DESC
    LIMIT 5
  `;
  return result.map(r => ({ ...r, total: parseFloat(r.total) }));
}

// Repeat customers whose silence has outlasted their own usual reorder rhythm —
// overdue when the quiet stretch exceeds 1.5x their average gap (min 14 days).
export async function getQuietCustomers() {
  const result = await sql`
    WITH cust_orders AS (
      SELECT customer_id, order_date,
             LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) as prev_date
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
    ),
    gaps AS (
      SELECT customer_id, AVG(order_date - prev_date) as avg_gap_days
      FROM cust_orders
      WHERE prev_date IS NOT NULL
      GROUP BY customer_id
    ),
    latest AS (
      SELECT customer_id, MAX(order_date) as last_order_date, COUNT(*) as order_count
      FROM orders
      WHERE status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
      GROUP BY customer_id
    )
    SELECT
      c.id,
      c.name,
      l.order_count,
      l.last_order_date,
      ROUND(g.avg_gap_days)                as avg_gap_days,
      (CURRENT_DATE - l.last_order_date)   as days_quiet
    FROM gaps g
    JOIN latest l ON l.customer_id = g.customer_id
    JOIN customers c ON c.id = g.customer_id
    WHERE (CURRENT_DATE - l.last_order_date) > GREATEST(g.avg_gap_days * 1.5, 14)
    ORDER BY (CURRENT_DATE - l.last_order_date) - g.avg_gap_days DESC
    LIMIT 6
  `;
  return result.map(r => ({
    ...r,
    order_count:  parseInt(r.order_count),
    avg_gap_days: parseInt(r.avg_gap_days),
    days_quiet:   parseInt(r.days_quiet),
  }));
}

export async function getActionableOrders() {
  const result = await sql`
    SELECT
      status,
      COUNT(*)            as count,
      SUM(order_value)    as value
    FROM orders
    WHERE status IN ('Order Placed', 'Awaiting Payment', 'Payment Confirmed', 'In Manufacturing', 'Ready to Dispatch', 'Dispatched')
    GROUP BY status
    ORDER BY
      CASE status
        WHEN 'Order Placed'       THEN 1
        WHEN 'Ready to Dispatch'  THEN 2
        WHEN 'In Manufacturing'   THEN 3
        WHEN 'Payment Confirmed'  THEN 4
        WHEN 'Awaiting Payment'   THEN 5
        WHEN 'Dispatched'         THEN 6
      END
  `;
  return result.map(r => ({ ...r, count: parseInt(r.count), value: parseFloat(r.value) }));
}

export async function getTopCustomers() {
  const result = await sql`
    SELECT
      c.id,
      c.name,
      COUNT(DISTINCT o.id)  as order_count,
      SUM(o.order_value)    as total_spend,
      MAX(o.order_date)     as last_order_date
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
    GROUP BY c.id, c.name
    ORDER BY total_spend DESC
    LIMIT 8
  `;
  return result.map(r => ({
    ...r,
    order_count:  parseInt(r.order_count),
    total_spend:  parseFloat(r.total_spend),
  }));
}

export async function getRepeatCustomersList() {
  const result = await sql`
    SELECT
      c.id,
      c.name,
      COUNT(DISTINCT o.id) as order_count,
      MAX(o.order_date)    as last_order_date
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE o.status NOT IN ('Order Placed', 'Awaiting Payment', 'Cancelled')
    GROUP BY c.id, c.name
    HAVING COUNT(DISTINCT o.id) > 1
    ORDER BY order_count DESC, last_order_date DESC
    LIMIT 10
  `;
  return result.map(r => ({ ...r, order_count: parseInt(r.order_count) }));
}

// Orders shipped per state and per city, for the India map on the dashboard.
// Counts distinct orders (not shipments), so a multi-destination order
// contributes once to each state/city it actually ships to.
export async function getOrdersByLocation() {
  const stateRows = await sql`
    SELECT s.state, COUNT(DISTINCT s.order_id) as order_count
    FROM shipments s
    JOIN orders o ON o.id = s.order_id
    WHERE s.state IS NOT NULL AND o.status != 'Cancelled'
      AND o.source IS DISTINCT FROM 'Expression of Interest'
    GROUP BY s.state
    ORDER BY order_count DESC
  `;

  const cityRows = await sql`
    SELECT s.city, s.state, COUNT(DISTINCT s.order_id) as order_count
    FROM shipments s
    JOIN orders o ON o.id = s.order_id
    WHERE s.city IS NOT NULL AND o.status != 'Cancelled'
      AND o.source IS DISTINCT FROM 'Expression of Interest'
    GROUP BY s.city, s.state
    ORDER BY order_count DESC
  `;

  return {
    byState: stateRows.map(r => ({ state: r.state, order_count: parseInt(r.order_count) })),
    byCity: cityRows.map(r => ({ city: r.city, state: r.state, order_count: parseInt(r.order_count) })),
  };
}
