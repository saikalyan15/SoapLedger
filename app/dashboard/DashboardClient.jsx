'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Factory,
  Info,
  Loader2,
  Truck,
} from 'lucide-react';
import {
  getCashFlowTrend,
  getProductPerformance,
  getRepeatCustomerRate,
  getTopExpenseCategories,
} from '@/lib/queries/dashboard';

const ACTION_REQUIRED_STATUSES = ['Awaiting Payment', 'Payment Confirmed', 'Ready to Dispatch'];

const STATUS_META = {
  'Ready to Dispatch': { icon: Truck, color: '#166534', bg: '#F0FDF4' },
  'In Manufacturing': { icon: Factory, color: '#6B21A8', bg: '#F5F3FF' },
  'Payment Confirmed': { icon: CheckCircle, color: '#0F766E', bg: '#F0FDFA' },
  'Awaiting Payment': { icon: CreditCard, color: '#B45309', bg: '#FFFBEB' },
  Dispatched: { icon: Truck, color: '#2563EB', bg: '#EFF6FF' },
};

const fmtCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const rounded = Math.round(Math.abs(Number(value)) / 10) * 10;
  return `${Number(value) < 0 ? '−' : ''}₹${rounded.toLocaleString('en-IN')}`;
};

const fmtNumber = (value, decimals = 0) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const fmtUnitCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `₹${Math.round(Number(value)).toLocaleString('en-IN')}`;
};

const signedCurrency = (value) => {
  if (value === 0) return fmtCurrency(0);
  return `${value > 0 ? '+' : ''}${fmtCurrency(value)}`;
};

const periodLabel = (filter) => filter === 'All Time' ? 'All available records' : filter;

const CashMetric = ({ label, value, note, tone = 'ink', helper }) => (
  <div className="money-metric">
    <div className="money-metric-label">{label}</div>
    <div className={`money-metric-value money-tone-${tone}`}>{value}</div>
    {note && <div className="money-metric-note">{note}</div>}
    {helper && <div className="money-metric-helper">{helper}</div>}
  </div>
);

const CashTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="money-chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          <span>{item.name}</span>
          <strong>{signedCurrency(item.value)}</strong>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ children }) => (
  <div className="money-empty">{children}</div>
);

export default function DashboardClient({
  initialRevenue,
  initialCustomers,
  initialProducts,
  initialCashFlow,
  initialExpenseCats,
  initialSnapshot,
  initialActionable,
  initialQuietCustomers,
  initialUnitEconomics,
}) {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [cashFlow, setCashFlow] = useState(initialCashFlow);
  const [expenseCats, setExpenseCats] = useState(initialExpenseCats);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const { this_month: thisMonth, last_month: lastMonth } = initialSnapshot;
  const paceComparison = initialSnapshot.last_month_same_period || lastMonth;

  const thisMonthNet = thisMonth.revenue - thisMonth.expenses;
  const comparisonNet = paceComparison.revenue - (paceComparison.expenses || 0);
  const lifetimeNet = initialRevenue.total_revenue - initialRevenue.total_expenses;
  const recoveryGap = Math.max(0, -lifetimeNet);
  const projectedRevenue = dayOfMonth >= 7
    ? thisMonth.revenue * (daysInMonth / dayOfMonth)
    : null;
  const monthProgress = Math.min(100, (dayOfMonth / daysInMonth) * 100);

  const ordersNeedingAction = initialActionable
    .filter((row) => ACTION_REQUIRED_STATUSES.includes(row.status))
    .reduce((sum, row) => sum + row.count, 0);

  const healthTone = thisMonthNet < 0 ? 'red'
    : ordersNeedingAction > 0 || lifetimeNet < 0 ? 'amber'
      : 'green';
  const healthTitle = thisMonthNet < 0
    ? 'More cash went out than came in this month.'
    : ordersNeedingAction > 0
      ? `${ordersNeedingAction} order${ordersNeedingAction === 1 ? '' : 's'} need attention.`
      : lifetimeNet < 0
        ? 'Cash-positive this month; lifetime costs are not fully recovered.'
        : 'Recorded cash is positive this month and overall.';

  const healthCopy = thisMonthNet < 0
    ? `${fmtCurrency(Math.abs(thisMonthNet))} more went out than came in during ${monthName}.`
    : lifetimeNet < 0
      ? `${fmtCurrency(thisMonthNet)} more came in than went out in ${monthName}. ${fmtCurrency(recoveryGap)} of recorded spend still needs to be earned back.`
      : `${fmtCurrency(thisMonthNet)} more came in than went out in ${monthName}. Recorded lifetime cash is ahead by ${fmtCurrency(lifetimeNet)}.`;

  const changeCopy = (value, comparison, noun = '') => {
    const delta = value - comparison;
    if (delta === 0) return `Level with the same point last month${noun}`;
    return `${fmtCurrency(Math.abs(delta))} ${delta > 0 ? 'more' : 'less'} than the same point last month${noun}`;
  };

  const handleFilterChange = (label) => {
    setFilter(label);
    const rangeStart = new Date();
    let from = null;
    if (label === 'Last 30 Days') {
      rangeStart.setDate(rangeStart.getDate() - 30);
      from = rangeStart.toISOString().split('T')[0];
    } else if (label === 'Last 90 Days') {
      rangeStart.setDate(rangeStart.getDate() - 90);
      from = rangeStart.toISOString().split('T')[0];
    } else if (label === 'This Year') {
      from = `${rangeStart.getFullYear()}-01-01`;
    }

    startTransition(async () => {
      const [nextCustomers, nextProducts, nextCashFlow, nextExpenseCats] = await Promise.all([
        getRepeatCustomerRate({ from, to: null }),
        getProductPerformance({ from, to: null }),
        getCashFlowTrend({ from, to: null }),
        getTopExpenseCategories({ from, to: null }),
      ]);
      setCustomers(nextCustomers);
      setProducts(nextProducts);
      setCashFlow(nextCashFlow);
      setExpenseCats(nextExpenseCats);
    });
  };

  const topProducts = [...products.top_products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
  const maxExpense = expenseCats[0]?.total || 1;

  return (
    <main className="money-dashboard">
      <header className="money-header">
        <div>
          <h1>Money dashboard</h1>
          <p>{monthName} · day {dayOfMonth} of {daysInMonth}</p>
        </div>
      </header>

      <section className={`money-status money-status-${healthTone}`} aria-live="polite">
        <div className="money-status-icon">
          {healthTone === 'green' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div>
          <h2>{healthTitle}</h2>
          <p>{healthCopy}</p>
        </div>
        <a href="#money-definition">See how this is calculated <ChevronRight size={15} /></a>
      </section>

      <section className="money-scoreboard" aria-label="Current month cash summary">
        <div className="money-scoreboard-primary">
          <CashMetric
            label="Money in"
            value={fmtCurrency(thisMonth.revenue)}
            note={dayOfMonth >= 7 ? changeCopy(thisMonth.revenue, paceComparison.revenue) : 'Month still too early for a fair comparison'}
            tone="green"
          />
          <CashMetric
            label="Money out"
            value={fmtCurrency(thisMonth.expenses)}
            note={dayOfMonth >= 7 ? changeCopy(thisMonth.expenses, paceComparison.expenses || 0) : 'Recorded expenses so far'}
            tone="red"
          />
          <CashMetric
            label="Net cash"
            value={signedCurrency(thisMonthNet)}
            note={dayOfMonth >= 7 ? changeCopy(thisMonthNet, comparisonNet) : 'Money in minus money out'}
            helper="Recorded cash, not accounting profit"
            tone={thisMonthNet >= 0 ? 'green' : 'red'}
          />
        </div>
        <div className="money-scoreboard-secondary">
          <CashMetric
            label="Money waiting"
            value={fmtCurrency(initialRevenue.pending_revenue)}
            helper="Unpaid orders; not counted as money in"
          />
          <CashMetric
            label="Lifetime cash position"
            value={signedCurrency(lifetimeNet)}
            helper="All recorded money in minus all recorded spend"
            tone={lifetimeNet >= 0 ? 'green' : 'red'}
          />
          <CashMetric
            label="Orders needing action"
            value={fmtNumber(ordersNeedingAction)}
            helper={ordersNeedingAction > 0 ? 'Waiting on payment, confirmation, or dispatch' : 'No orders need your attention'}
          />
        </div>
      </section>

      <section className="money-two-column">
        <article className="money-panel money-pace-panel">
          <div className="money-panel-heading">
            <div>
              <h2>Month pace</h2>
              <p>A pace estimate, not a forecast</p>
            </div>
          </div>
          <div className="money-pace-track" aria-label={`Day ${dayOfMonth} of ${daysInMonth}`}>
            <div style={{ width: `${monthProgress}%` }} />
          </div>
          <div className="money-pace-values">
            <div><span>Current money in</span><strong>{fmtCurrency(thisMonth.revenue)}</strong><small>Day {dayOfMonth} of {daysInMonth}</small></div>
            <div><span>Last month total</span><strong>{fmtCurrency(lastMonth.revenue)}</strong><small>Completed month</small></div>
            <div><span>If this pace continues</span><strong>{projectedRevenue == null ? 'Too early' : fmtCurrency(projectedRevenue)}</strong><small>Not guaranteed</small></div>
          </div>
        </article>

        <article className="money-panel">
          <div className="money-panel-heading">
            <div>
              <h2>Orders in progress</h2>
              <p>Operational work tied to future or recognised cash</p>
            </div>
            <Link href="/orders">View orders <ChevronRight size={14} /></Link>
          </div>
          {initialActionable.length === 0 ? (
            <EmptyState><CheckCircle size={17} /> All clear</EmptyState>
          ) : (
            <div className="money-order-list">
              {initialActionable.map((row) => {
                const meta = STATUS_META[row.status] || { icon: Clock, color: '#6B7280', bg: '#F9FAFB' };
                const StatusIcon = meta.icon;
                return (
                  <Link href="/orders" key={row.status} style={{ '--status-color': meta.color, '--status-bg': meta.bg }}>
                    <StatusIcon size={15} />
                    <span>{row.status}</span>
                    <strong>{row.count}</strong>
                    <small>{fmtCurrency(row.value)}</small>
                    <ChevronRight size={14} />
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="money-readiness" id="money-definition">
        <div className="money-readiness-copy">
          <Info size={20} />
          <div>
            <span>How unit cost is calculated</span>
            <h2>Blended unit cost is ready. Product-level margin is still estimated.</h2>
            <p>
              Last {initialUnitEconomics.window_days} days: {fmtUnitCurrency(initialUnitEconomics.included_spend)} from categories marked “include in cost price”
              {' '}÷ {fmtNumber(initialUnitEconomics.equivalent_soaps, 1)} equivalent soaps sold. Included: {initialUnitEconomics.included_categories.join(', ')}.
            </p>
          </div>
        </div>
        <div className="money-readiness-metric">
          <span>Blended unit cost</span>
          <strong>{fmtUnitCurrency(initialUnitEconomics.unit_cost)} per soap</strong>
          <small>Included recorded costs ÷ equivalent soaps</small>
        </div>
        <div className="money-readiness-metric">
          <span>Est. cash contribution</span>
          <strong>{fmtUnitCurrency(initialUnitEconomics.unit_contribution)} per soap</strong>
          <small>{fmtUnitCurrency(initialUnitEconomics.avg_selling_price)} average selling price · before overhead</small>
        </div>
        <div className="money-readiness-metric">
          <span>Break-even</span>
          <strong>Not calculated</strong>
          <small>Fixed monthly costs are not identified yet</small>
        </div>
      </section>

      <section className="money-analysis-header">
        <div>
          <h2>Look back and decide</h2>
          <p>Historical patterns sit below the current-month cash view.</p>
        </div>
        <div className="money-period" role="group" aria-label="Analysis period">
          <span>Analysis period</span>
          <div>
            {['All Time', 'This Year', 'Last 90 Days', 'Last 30 Days'].map((label) => (
              <button
                type="button"
                key={label}
                aria-pressed={filter === label}
                onClick={() => handleFilterChange(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="money-analysis-grid" aria-busy={isPending}>
        {isPending && <div className="money-loading"><Loader2 className="animate-spin" size={28} /> Updating analysis</div>}

        <article className="money-panel money-chart-panel">
          <div className="money-panel-heading">
            <div>
              <h2>Net cash by month</h2>
              <p>Money in, all recorded money out, and the difference · {periodLabel(filter)}</p>
            </div>
          </div>
          {cashFlow.length === 0 ? (
            <EmptyState>No cash history in this period</EmptyState>
          ) : (
            <div className="money-chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 760, height: 310 }}>
                <ComposedChart data={cashFlow} margin={{ top: 8, right: 14, left: 2, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                  <Tooltip content={<CashTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <ReferenceLine y={0} stroke="#9CA3AF" />
                  <Bar dataKey="revenue" name="Money in" fill="#4F8A67" radius={[3, 3, 0, 0]} maxBarSize={34} />
                  <Bar dataKey="total_spend" name="Money out" fill="#D76757" radius={[3, 3, 0, 0]} maxBarSize={34} />
                  <Line dataKey="net_cash_flow" name="Net cash" stroke="#173F31" strokeWidth={2.5} dot={{ r: 3, fill: '#173F31' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="money-panel money-expenses-panel">
          <div className="money-panel-heading">
            <div>
              <h2>Where money went</h2>
              <p>Ranked by recorded spend · {periodLabel(filter)}</p>
            </div>
            <Link href="/expenses">View expenses <ChevronRight size={14} /></Link>
          </div>
          {expenseCats.length === 0 ? (
            <EmptyState>No expenses in this period</EmptyState>
          ) : (
            <div className="money-expense-list">
              {expenseCats.map((category) => (
                <div key={category.name}>
                  <div><span>{category.name}</span><strong>{fmtCurrency(category.total)}</strong></div>
                  <div className="money-expense-bar"><span style={{ width: `${(category.total / maxExpense) * 100}%` }} /></div>
                  <small>{category.type === 'one_time' ? 'One-time purchase' : 'Recurring category'}</small>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="money-panel money-products-panel">
          <div className="money-panel-heading">
            <div>
              <h2>What sold</h2>
              <p>Revenue and realised selling price · {periodLabel(filter)}</p>
            </div>
            <Link href="/products">View products <ChevronRight size={14} /></Link>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState>No product sales in this period</EmptyState>
          ) : (
            <div className="money-table-wrap">
              <table className="money-table">
                <thead><tr><th>Product</th><th>Soaps sold</th><th>Revenue</th><th>Avg. selling price</th></tr></thead>
                <tbody>
                  {topProducts.map((product) => {
                    const averagePrice = product.units_sold > 0 ? product.gross_revenue / product.units_sold : 0;
                    return (
                      <tr key={product.name}>
                        <td><strong>{product.name}</strong><small>{product.base_type}</small></td>
                        <td>{fmtNumber(product.units_sold)}</td>
                        <td>{fmtCurrency(product.revenue)}</td>
                        <td>{fmtCurrency(averagePrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="money-table-note">Product-level profit is not shown because this blended unit cost is not allocated by recipe.</p>
        </article>

        <article className="money-panel money-customers-panel">
          <div className="money-panel-heading">
            <div>
              <h2>Customers worth a message</h2>
              <p>Repeat customers overdue for their usual reorder</p>
            </div>
            <div className="money-repeat-rate"><strong>{fmtNumber(customers.repeat_rate, 1)}%</strong><span>repeat rate</span></div>
          </div>
          {initialQuietCustomers.length === 0 ? (
            <EmptyState><CheckCircle size={17} /> No repeat customer has gone quiet</EmptyState>
          ) : (
            <div className="money-customer-list">
              {initialQuietCustomers.map((customer) => (
                <div key={customer.id}>
                  <span className="money-customer-avatar">{customer.name.charAt(0)}</span>
                  <div><strong>{customer.name}</strong><small>{customer.order_count} orders</small></div>
                  <p>Usually every {customer.avg_gap_days} days</p>
                  <p>Quiet for <strong>{customer.days_quiet} days</strong></p>
                  <span>Worth a personal check-in</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/repeat-customers" className="money-bottom-link">View customer history <ChevronRight size={14} /></Link>
        </article>
      </section>
    </main>
  );
}
