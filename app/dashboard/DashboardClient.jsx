'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area,
  ComposedChart, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Users, ShoppingBag,
  DollarSign, AlertTriangle, Loader2, Factory, ArrowUpRight, ArrowDownRight, Minus,
  Clock, CheckCircle, Truck, CreditCard, CircleDollarSign, ChevronRight,
} from 'lucide-react';
import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
  getMonthlyBaseRevenue,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getMonthlyOrderTrend,
} from '@/lib/queries/dashboard';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 0) => {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
const fmtCurrency = (n) => {
  if (n == null) return '—';
  return `₹${(Math.round(Number(n) / 10) * 10).toLocaleString('en-IN')}`;
};
const fmtNum = (n) => {
  if (n == null) return '—';
  return Math.round(Number(n)).toLocaleString('en-IN');
};

// ── Palette ───────────────────────────────────────────────────────────────────
// One hue FAMILY per base (no green-vs-teal lookalikes), covering every base_type
// in the products table. Validated for CVD separation, chroma, and lightness on
// white cards (worst pair ΔE 11.1, floor band — relieved by white segment gaps,
// legend, and tooltips). Gold is sub-3:1 contrast on white: same relief applies.
// 'Other' is the deliberate muted fold bucket, excluded from series checks.
const BASE_COLOURS = {
  'Glycerine':       '#2F8F5B', // green (brand)
  'Goat Milk':       '#5B3E9E', // violet
  'Shea Butter':     '#D4A017', // gold
  'Red Wine':        '#9D2450', // wine
  'Loofah':          '#A0622D', // brown
  'Travel':          '#3178C6', // blue
  'Papaya Cucumber': '#C7490B', // papaya orange
  'Mixed':           '#D66BA0', // pink
  'Other':           '#9CA3AF', // fold bucket — deliberately muted
};

// Any base type added later gets a distinct spare hue instead of collapsing to
// gray (which made Mixed and Papaya Cucumber indistinguishable before).
const SPARE_COLOURS = ['#0E7490', '#B91C1C', '#4D7C0F', '#6D28D9'];
const assignedSpares = {};
let spareIndex = 0;
const colourForBase = (base) => {
  if (BASE_COLOURS[base]) return BASE_COLOURS[base];
  if (!assignedSpares[base]) assignedSpares[base] = SPARE_COLOURS[spareIndex++ % SPARE_COLOURS.length];
  return assignedSpares[base];
};
const STATUS_COLOR = { green: '#16A34A', amber: '#D97706', red: '#DC2626' };

const STATUS_META = {
  'Ready to Dispatch': { icon: Truck,        color: '#16A34A', bg: '#F0FDF4' },
  'In Manufacturing':  { icon: Factory,      color: '#6B21A8', bg: '#F5F3FF' },
  'Payment Confirmed': { icon: CheckCircle,  color: '#0F766E', bg: '#F0FDFA' },
  'Awaiting Payment':  { icon: CreditCard,   color: '#D97706', bg: '#FFFBEB' },
  'Dispatched':        { icon: Truck,        color: '#2563EB', bg: '#EFF6FF' },
};

// ── Reusable components ───────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, loading, empty, icon: Icon, isMobile }) => (
  <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '16px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: isMobile ? '20px' : '28px', display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div>
        <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>{subtitle}</p>}
      </div>
      {Icon && !isMobile && <div style={{ padding: '8px', background: '#F7F3EA', borderRadius: '8px', color: '#6B7280' }}><Icon size={18} /></div>}
    </div>
    <div style={{ flex: 1, position: 'relative' }}>
      {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={28} className="animate-spin" style={{ color: '#1B4332' }} /></div>}
      {empty && !loading ? <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><AlertTriangle size={28} style={{ marginBottom: '8px', opacity: 0.4 }} /><span style={{ fontSize: '13px' }}>No data</span></div> : children}
    </div>
  </div>
);

// Delta card for "This Month" — only shows MoM delta after day 6 to avoid
// misleading "₹X less" comparisons against a full previous month.
const DeltaCard = ({ label, value, delta, dayOfMonth, color, format = 'currency', loading, isMobile }) => {
  const showDelta = dayOfMonth >= 7;
  const isPositive = delta > 0;
  const isZero = delta === 0 || delta == null;
  const deltaColor = isZero ? '#6B7280' : isPositive ? '#16A34A' : '#DC2626';
  const DeltaIcon = isZero ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;
  const formattedDelta = format === 'currency' ? fmtCurrency(Math.abs(delta)) : fmtNum(Math.abs(delta));
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: isMobile ? '14px 16px' : '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '6px' }}>
        {loading ? <Loader2 size={24} className="animate-spin" style={{ color: '#E5E7EB' }} /> : value}
      </div>
      {!loading && (
        showDelta ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DeltaIcon size={14} color={deltaColor} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: deltaColor }}>{isZero ? 'same as' : `${formattedDelta} ${isPositive ? 'more than'  : 'less than'}`}</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>same point last month</span>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>day {dayOfMonth} — month in progress</div>
        )
      )}
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon, accentColor, status, statusLabel, statusNote }) => {
  const dot = STATUS_COLOR[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: `1px solid ${accentColor}22` }}>
      <div style={{ width: '4px', height: '28px', borderRadius: '2px', background: accentColor, flexShrink: 0 }} />
      <Icon size={15} color={accentColor} />
      <span style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111827' }}>{title}</span>
      {status && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: `${dot}15`, border: `1px solid ${dot}30`, padding: '4px 12px', borderRadius: '20px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: dot }}>{statusLabel}</span>
          {statusNote && <span style={{ fontSize: '11px', color: '#6B7280' }}>· {statusNote}</span>}
        </div>
      )}
    </div>
  );
};

const MobileSectionToggle = ({ visible, expanded, onToggle, label, statusText }) => visible ? (
  <button
    type="button"
    className="dashboard-section-toggle"
    onClick={onToggle}
    aria-expanded={expanded}
  >
    <span>{label}</span>
    <span className="dashboard-section-toggle-meta">{statusText}</span>
    <ChevronRight size={18} style={{ transform: expanded ? 'rotate(90deg)' : 'none' }} />
  </button>
) : null;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E9E2D4', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: '160px', zIndex: 1000 }}>
      <p style={{ fontWeight: 700, marginBottom: '8px', color: '#1A1A1A' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: p.color || p.fill, marginBottom: '4px' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {p.name?.includes('Units') || p.name?.includes('Soaps') || p.name === 'Orders' ? fmtNum(p.value) : fmtCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DashboardClient = ({
  initialRevenue, initialCustomers, initialProducts, initialBaseTrend, initialCostTrend,
  initialProfitability, initialProjection, initialOrderTrend,
  initialSnapshot, initialActionable, initialTopCustomers, initialRepeatCustomers,
}) => {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSections, setMobileSections] = useState({ products: true, customers: false, finances: false });

  const [revenue, setRevenue]           = useState(initialRevenue);
  const [customers, setCustomers]       = useState(initialCustomers);
  const [products, setProducts]         = useState(initialProducts);
  const [baseTrend, setBaseTrend]       = useState(initialBaseTrend);
  const [costTrend, setCostTrend]       = useState(initialCostTrend);
  const [profitability, setProfitability] = useState(initialProfitability);
  const [projection, setProjection]     = useState(initialProjection);
  const [orderTrend, setOrderTrend]     = useState(initialOrderTrend);

  // These are always current-period — not affected by the date filter
  const snapshot         = initialSnapshot;
  const actionable       = initialActionable;
  const topCustomers     = initialTopCustomers;
  const repeatCustomers  = initialRepeatCustomers;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleFilterChange = (label) => {
    setFilter(label);
    let from = null;
    const now = new Date();
    if (label === 'Last 30 Days') from = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    else if (label === 'Last 90 Days') from = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
    else if (label === 'This Year') from = `${new Date().getFullYear()}-01-01`;
    startTransition(() => {
      Promise.all([
        getRevenueKPIs({ from, to: null }),
        getRepeatCustomerRate({ from, to: null }),
        getProductPerformance({ from, to: null }),
        getMonthlyBaseRevenue({ from, to: null }),
        getCostPriceTrend({ from, to: null }),
        getMonthlySurplusDeficit(),
        getBreakEvenProjection(),
        getMonthlyOrderTrend({ from, to: null }),
      ]).then(([rev, cust, prod, bTrend, cTrend, prof, proj, oTrend]) => {
        setRevenue(rev); setCustomers(cust); setProducts(prod);
        setBaseTrend(bTrend); setCostTrend(cTrend); setProfitability(prof);
        setProjection(proj); setOrderTrend(oTrend);
      });
    });
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalBaseRevenue = products.revenue_by_base.reduce((s, i) => s + i.revenue, 0);
  const topProductsSorted = [...products.top_products].sort((a, b) => b.revenue - a.revenue);
  const sortedBaseRevenue = [...products.revenue_by_base]
    .filter((item) => item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const baseRevenueData = sortedBaseRevenue.length > 5
    ? [
        ...sortedBaseRevenue.slice(0, 4),
        {
          base_type: 'Other',
          revenue: sortedBaseRevenue.slice(4).reduce((sum, item) => sum + item.revenue, 0),
        },
      ]
    : sortedBaseRevenue;

  const { this_month: tm, last_month: lm } = snapshot;
  const paceComparison = snapshot.last_month_same_period || lm;
  const dayOfMonth  = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const paceBar = Math.min((dayOfMonth / daysInMonth) * 100, 100);

  const totalActionable = actionable.reduce((s, r) => s + r.count, 0);

  const filterScope = filter === 'All Time' ? 'All available records' : filter;
  const projectedRevenue = dayOfMonth >= 7 ? tm.revenue * (daysInMonth / dayOfMonth) : null;
  const revenuePaceDelta = tm.revenue - paceComparison.revenue;

  // ── Traffic lights ──────────────────────────────────────────────────────────
  const repeatRate = customers.repeat_rate;
  const customerStatus = repeatRate >= 40 ? { status: 'green', label: 'Healthy',     note: `${fmt(repeatRate, 1)}% repeat` }
    : repeatRate >= 20  ? { status: 'amber', label: 'Building',    note: `${fmt(repeatRate, 1)}% repeat` }
    :                     { status: 'red',   label: 'Low loyalty', note: `${fmt(repeatRate, 1)}% repeat` };

  const lastCost = costTrend[costTrend.length - 1];
  const unitMargin = lastCost?.avg_selling_price > 0
    ? (lastCost.avg_selling_price - lastCost.cost_price_per_soap) / lastCost.avg_selling_price : null;
  const perSoapProfit = unitMargin == null ? null
    : fmtCurrency(lastCost.avg_selling_price - lastCost.cost_price_per_soap);
  const opsStatus = unitMargin == null ? { status: 'amber', label: 'No data', note: '' }
    : unitMargin >= 0.40 ? { status: 'green', label: 'Healthy margin', note: `≈${perSoapProfit} profit per soap` }
    : unitMargin >= 0.20 ? { status: 'amber', label: 'Tight margin',   note: `≈${perSoapProfit} profit per soap` }
    :                      { status: 'red',   label: 'Low margin',     note: `≈${perSoapProfit} profit per soap` };

  const pl = revenue.profit_loss;
  const profitStatus = pl > 0                              ? { status: 'green', label: 'In profit',      note: `+${fmtCurrency(pl)}` }
    : pl > -(revenue.total_revenue * 0.1)                  ? { status: 'amber', label: 'Near breakeven', note: fmtCurrency(pl) }
    :                                                        { status: 'red',   label: 'At a loss',      note: fmtCurrency(pl) };

  const paceKnown = dayOfMonth >= 7; // same guard as DeltaCard — early-month deltas are noise
  const healthTone = totalActionable > 0 || (paceKnown && revenuePaceDelta < 0) ? '#D97706' : '#16A34A';
  const healthSummary = totalActionable > 0
    ? `${totalActionable} order${totalActionable === 1 ? '' : 's'} need attention`
    : paceKnown && revenuePaceDelta < 0 ? 'Revenue is behind pace' : 'Business is on track';

  const toggleMobileSection = (section) => {
    setMobileSections((current) => ({ ...current, [section]: !current[section] }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '28px' : '34px', color: '#1B4332', margin: '0 0 4px 0' }}>Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Business health at a glance</p>
        </div>
        <div className="dashboard-filter" role="group" aria-label="Dashboard date range" style={{ display: 'flex', background: '#FFFFFF', padding: '4px', borderRadius: '10px', border: '1px solid #E9E2D4' }}>
          {['All Time', 'This Year', 'Last 90 Days', 'Last 30 Days'].map((label) => (
            <button key={label} aria-pressed={filter === label} onClick={() => handleFilterChange(label)} style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', background: filter === label ? '#1B4332' : 'transparent', color: filter === label ? '#FFFFFF' : '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-health-summary" style={{ borderLeftColor: healthTone }}>
        <div className="dashboard-health-icon" style={{ background: `${healthTone}14`, color: healthTone }}>
          <CircleDollarSign size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="dashboard-health-title">{healthSummary}</div>
          <div className="dashboard-health-copy">
            {!paceKnown
              ? <>Day {dayOfMonth} — too early in the month for a fair comparison with last month.</>
              : revenuePaceDelta === 0
                ? <>Revenue is <strong>level with the same point last month</strong>.</>
                : <>Revenue is {revenuePaceDelta > 0 ? 'ahead of' : 'behind'} the same point last month by <strong>{fmtCurrency(Math.abs(revenuePaceDelta))}</strong>.</>}
            {unitMargin != null && <>
              {' '}A soap costs about <strong>{fmtCurrency(lastCost.cost_price_per_soap)}</strong> to make and sells for about <strong>{fmtCurrency(lastCost.avg_selling_price)}</strong> — roughly <strong>{fmtCurrency(lastCost.avg_selling_price - lastCost.cost_price_per_soap)}</strong> profit on each one.
            </>}
          </div>
        </div>
        {totalActionable > 0 && <Link href="/orders" className="dashboard-health-link">Review orders <ChevronRight size={15} /></Link>}
      </div>

      <div className="dashboard-scope-note"><span>{filterScope}</span> applies to Products, customer rate, and period finance KPIs. This Month and customer lists remain current/lifetime views.</div>

      {/* ─── THIS MONTH ──────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="This Month" icon={ShoppingBag} accentColor="#1B4332" />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <DeltaCard label="Revenue"    value={fmtCurrency(tm.revenue)} delta={tm.revenue - paceComparison.revenue} dayOfMonth={dayOfMonth} color="#1B4332" format="currency" loading={false} isMobile={isMobile} />
          <DeltaCard label="Orders"     value={fmtNum(tm.orders)}       delta={tm.orders  - paceComparison.orders}  dayOfMonth={dayOfMonth} color="#1B4332" format="number"   loading={false} isMobile={isMobile} />
          <DeltaCard label="Soaps Sold" value={fmtNum(tm.soaps)}        delta={tm.soaps   - paceComparison.soaps}   dayOfMonth={dayOfMonth} color="#1B4332" format="number"   loading={false} isMobile={isMobile} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {/* Monthly pace card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Month Progress</div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>{fmtCurrency(tm.revenue)}</span>
              <span style={{ fontSize: '13px', color: '#6B7280', marginLeft: '8px' }}>so far</span>
            </div>
            {/* Day-of-month progress bar */}
            <div style={{ height: '6px', background: '#F0EBDF', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', width: `${paceBar}%`, background: '#D1FAE5', borderRadius: '3px', position: 'relative' }}>
                <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '3px', background: '#1B4332', borderRadius: '2px' }} />
              </div>
            </div>
            {/* Context — no projection, just reference points */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280' }}>
              <span>Day {dayOfMonth} of {daysInMonth}</span>
              <span>Last month total <strong style={{ color: '#374151' }}>{fmtCurrency(lm.revenue)}</strong></span>
            </div>
            {projection.avgMonthlyRevenue > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                6-month avg <strong style={{ color: '#374151' }}>{fmtCurrency(projection.avgMonthlyRevenue)}</strong>
              </div>
            )}
            {projectedRevenue != null && <div style={{ marginTop: '6px', fontSize: '12px', color: '#1B4332' }}>Current pace projects <strong>{fmtCurrency(projectedRevenue)}</strong> by month end</div>}
          </div>

          {/* Actionable orders */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Action</div>
              {totalActionable > 0 && <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>{totalActionable} orders</div>}
            </div>
            {actionable.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontSize: '14px', fontWeight: 600, padding: '8px 0' }}>
                <CheckCircle size={18} /> All clear
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actionable.map((row) => {
                  const meta = STATUS_META[row.status] || { icon: Clock, color: '#6B7280', bg: '#F9FAFB' };
                  const StatusIcon = meta.icon;
                  return (
                    <Link href="/orders" key={row.status} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: meta.bg, borderRadius: '8px', textDecoration: 'none' }}>
                      <StatusIcon size={14} color={meta.color} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', flex: 1 }}>{row.status}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>{row.count}</span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{fmtCurrency(row.value)}</span>
                      <ChevronRight size={14} color={meta.color} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── PRODUCTS ────────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <MobileSectionToggle visible={isMobile} expanded={mobileSections.products} onToggle={() => toggleMobileSection('products')} label="Products" statusText={opsStatus.label} />
        {(!isMobile || mobileSections.products) && <>
        {!isMobile && <SectionHeader title="Products" icon={Package} accentColor="#B45309" status={opsStatus.status} statusLabel={opsStatus.label} statusNote={opsStatus.note} />}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '20px' }}>

          <ChartCard title="Top Products by Revenue" subtitle="Coloured by soap base" loading={isPending} empty={products.top_products.length === 0} icon={Package} isMobile={isMobile}>
            <div style={{ height: isMobile ? '260px' : '300px', width: '100%', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 300 }}>
                <BarChart layout="vertical" data={topProductsSorted} margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151' }} width={isMobile ? 80 : 110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#2F8F5B" radius={[0, 6, 6, 0]}>
                    {topProductsSorted.map((p) => (
                      <Cell key={p.name} fill={colourForBase(p.base_type)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Per-unit price vs make cost — instant win/lose read, not a bare number */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
              {lastCost?.cost_price_per_soap > 0 && (
                <span style={{ fontSize: '11px', color: '#6B7280' }}>each soap costs ~{fmtCurrency(lastCost.cost_price_per_soap)} to make:</span>
              )}
              {topProductsSorted.slice(0, 4).map((p) => {
                const asp = p.units_sold > 0 ? p.revenue / p.units_sold : 0;
                // Travel packs are 1/5th of a soap — blended make cost doesn't apply per piece
                const margin = lastCost?.cost_price_per_soap > 0 && asp > 0 && p.base_type !== 'Travel'
                  ? (asp - lastCost.cost_price_per_soap) / asp : null;
                const tone = margin == null ? { bg: '#F9FAFB', border: '#E5E7EB', text: '#4B5563' }
                  : margin >= 0.40 ? { bg: '#F0FDF4', border: '#DCFCE7', text: '#166534' }
                  : margin >= 0.20 ? { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' }
                  :                  { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' };
                const profit = margin == null ? null : Math.round(asp - lastCost.cost_price_per_soap);
                return (
                  <div key={p.name} style={{ fontSize: '11px', background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: '6px', padding: '3px 8px', color: tone.text }}>
                    <span style={{ fontWeight: 700 }}>{p.name.split(' ')[0]}</span> · sells ₹{Math.round(asp)}
                    {profit != null && <> · <span style={{ fontWeight: 700 }}>{profit >= 0 ? `₹${profit} profit` : `loses ₹${Math.abs(profit)}`}</span> each</>}
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Revenue by Base Type" subtitle="Which soap category earns most" loading={isPending} empty={products.revenue_by_base.length === 0} icon={Package} isMobile={isMobile}>
            <div style={{ height: isMobile ? '260px' : '300px', position: 'relative', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 420, height: 300 }}>
                <PieChart>
                  <Pie data={baseRevenueData} dataKey="revenue" nameKey="base_type" cx="50%" cy="47%" innerRadius={isMobile ? 48 : 62} outerRadius={isMobile ? 76 : 96} paddingAngle={2}>
                    {baseRevenueData.map((entry) => (
                      <Cell key={entry.base_type} fill={colourForBase(entry.base_type)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(v) => { const item = baseRevenueData.find(d => d.base_type === v); return <span style={{ color: '#4B5563', fontSize: '11px' }}>{v}: <b>{fmtCurrency(item?.revenue)}</b></span>; }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '43%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>{fmtCurrency(totalBaseRevenue)}</div>
                <div style={{ fontSize: '10px', color: '#6B7280' }}>total</div>
              </div>
            </div>
          </ChartCard>
        </div>

        <div style={{ marginTop: '20px' }}>
          <ChartCard title="Monthly Revenue by Soap Base" subtitle="Which bases are in demand each month" loading={isPending} empty={baseTrend.months.length === 0} icon={Package} isMobile={isMobile}>
            <div style={{ height: isMobile ? '280px' : '320px', width: '100%', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 900, height: 320 }}>
                <BarChart data={baseTrend.months} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EBDF" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(v)}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(v) => <span style={{ color: '#4B5563', fontSize: '11px' }}>{v}</span>} />
                  {baseTrend.base_types.map((base) => (
                    <Bar key={base} dataKey={base} name={base} stackId="base" fill={colourForBase(base)} stroke="#FFFFFF" strokeWidth={1} maxBarSize={56} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        </>}
      </div>

      {/* ─── CUSTOMERS ───────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <MobileSectionToggle visible={isMobile} expanded={mobileSections.customers} onToggle={() => toggleMobileSection('customers')} label="Customers" statusText={`${fmt(repeatRate, 1)}% repeat`} />
        {(!isMobile || mobileSections.customers) && <>
        {!isMobile && <SectionHeader title="Customers" icon={Users} accentColor="#6B21A8" status={customerStatus.status} statusLabel={customerStatus.label} statusNote={customerStatus.note} />}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>

          {/* Repeat customers */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '16px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: isMobile ? '20px' : '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>Repeat Customers</h3>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>
                  Ordered more than once{repeatRate > 0 && <> — about <strong style={{ color: '#374151' }}>1 in {Math.max(1, Math.round(100 / repeatRate))}</strong> of your customers comes back</>}
                </p>
              </div>
              {repeatCustomers.length > 0 && <div style={{ background: '#F5F3FF', color: '#6B21A8', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>{repeatCustomers.length}</div>}
            </div>
            {repeatCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: '13px' }}>No repeat customers yet</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                  {repeatCustomers.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#FBF9F3', borderRadius: '10px', border: '1px solid #F0EBDF' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#6B21A8' }}>{c.name.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.order_count} orders · last {new Date(c.last_order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/repeat-customers" style={{ display: 'block', textAlign: 'center', marginTop: '14px', fontSize: '12px', fontWeight: 700, color: '#6B21A8', textDecoration: 'none' }}>
                  View all &amp; soap history →
                </Link>
              </>
            )}
          </div>

          {/* Top customers by LTV */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '16px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: isMobile ? '20px' : '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>Top Customers</h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>By lifetime spend</p>
            </div>
            {topCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: '13px' }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topCustomers.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < topCustomers.length - 1 ? '1px solid #F0EBDF' : 'none' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#9CA3AF', width: '20px', textAlign: 'center', flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6B21A8' }}>{c.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.order_count} orders</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1B4332', flexShrink: 0 }}>{fmtCurrency(c.total_spend)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>}
      </div>

      {/* ─── FINANCES ────────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <MobileSectionToggle visible={isMobile} expanded={mobileSections.finances} onToggle={() => toggleMobileSection('finances')} label="Finances" statusText={profitStatus.label} />
        {(!isMobile || mobileSections.finances) && <>
        {!isMobile && <SectionHeader title="Finances" icon={DollarSign} accentColor="#2C6E9E" status={profitStatus.status} statusLabel={profitStatus.label} statusNote={profitStatus.note} />}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#C44536' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Cost per Soap</div>
            <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {lastCost?.cost_price_per_soap > 0 ? fmtCurrency(lastCost.cost_price_per_soap) : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
              What one soap costs you all-in (every recurring expense ÷ every soap sold)
              {lastCost?.avg_selling_price > 0 && <> — and you sell at <strong style={{ color: '#374151' }}>{fmtCurrency(lastCost.avg_selling_price)}</strong> on average</>}.
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: pl >= 0 ? '#16A34A' : '#DC2626' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Net Profit / Loss</div>
            <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: pl >= 0 ? '#16A34A' : '#DC2626', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {pl >= 0 ? '+' : ''}{fmtCurrency(pl)}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
              {pl >= 0
                ? <>You've earned <strong style={{ color: '#374151' }}>{fmtCurrency(pl)}</strong> more than you've spent, everything included.</>
                : <>You've spent <strong style={{ color: '#374151' }}>{fmtCurrency(Math.abs(pl))}</strong> more than you've earned so far, everything included.</>}
              {' '}(Earned {fmtCurrency(revenue.total_revenue)} · spent {fmtCurrency(revenue.total_expenses)})
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E9E2D4', borderRadius: '12px', boxShadow: '0 1px 3px rgba(27, 67, 50, 0.06)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: pl >= 0 ? '#16A34A' : '#DC2626' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Break-Even</div>
            <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {projection.flatBreakEvenMonth}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
              {projection.flatBreakEvenMonth === 'Never'
                ? <>Monthly costs are higher than monthly revenue right now, so the {fmtCurrency(projection.gapToClose)} gap isn't closing.</>
                : projection.flatBreakEvenMonth
                  ? <>Keep the current pace ({fmtCurrency(projection.avgMonthlyRevenue)}/month) and by then you'll have earned back everything spent since day one — {fmtCurrency(projection.gapToClose)} still to recover.</>
                  : <>Not enough history yet to project this.</>}
            </div>
          </div>
        </div>

        <ChartCard title="Monthly Surplus / Deficit" subtitle="Revenue vs costs — are we making money each month?" loading={isPending} empty={profitability.length === 0} icon={DollarSign} isMobile={isMobile}>
          <div style={{ height: isMobile ? '280px' : '320px', width: '100%', minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 900, height: 320 }}>
              <ComposedChart data={profitability} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBDF" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis yAxisId="money" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v / 10) * 10)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar yAxisId="money" dataKey="revenue" name="Revenue" fill="#2F8F5B" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="money" dataKey="recurring_costs" name="Costs" fill="#C44536" radius={[4, 4, 0, 0]} />
                <Line yAxisId="money" type="monotone" dataKey="surplus_deficit" name="Surplus/Deficit" stroke="#1B4332" strokeWidth={2.5} dot={{ fill: '#1B4332', r: 3.5 }} />
                <ReferenceLine yAxisId="money" y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        </>}
      </div>

    </div>
  );
};

export default DashboardClient;
