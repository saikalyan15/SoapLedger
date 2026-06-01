'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area,
  ComposedChart, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, Users, ShoppingBag,
  DollarSign, AlertTriangle, Loader2, Factory, ArrowUpRight, ArrowDownRight, Minus,
  Clock, CheckCircle, Truck, CreditCard,
} from 'lucide-react';
import {
  getRevenueKPIs,
  getRepeatCustomerRate,
  getProductPerformance,
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
const BASE_COLOURS = {
  'Glycerine':   '#1B4332', 'Goat Milk':   '#2D6A4F', 'Shea Butter': '#40916C',
  'Loofah':      '#52B788', 'Travel':      '#74C69D', 'Red Wine':    '#95D5B2', 'Other': '#B7E4C7',
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
  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: isMobile ? '20px' : '28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div>
        <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>{subtitle}</p>}
      </div>
      {Icon && !isMobile && <div style={{ padding: '8px', background: '#F9FAFB', borderRadius: '8px', color: '#6B7280' }}><Icon size={18} /></div>}
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
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: isMobile ? '14px 16px' : '20px 24px', position: 'relative', overflow: 'hidden' }}>
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
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>last month</span>
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
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: `${dot}15`, border: `1px solid ${dot}30`, padding: '4px 12px', borderRadius: '20px' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: dot }}>{statusLabel}</span>
        {statusNote && <span style={{ fontSize: '11px', color: '#6B7280' }}>· {statusNote}</span>}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: '160px', zIndex: 1000 }}>
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
  initialRevenue, initialCustomers, initialProducts, initialCostTrend,
  initialProfitability, initialProjection, initialOrderTrend,
  initialSnapshot, initialActionable, initialTopCustomers, initialReorderCandidates,
}) => {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);

  const [revenue, setRevenue]           = useState(initialRevenue);
  const [customers, setCustomers]       = useState(initialCustomers);
  const [products, setProducts]         = useState(initialProducts);
  const [costTrend, setCostTrend]       = useState(initialCostTrend);
  const [profitability, setProfitability] = useState(initialProfitability);
  const [projection, setProjection]     = useState(initialProjection);
  const [orderTrend, setOrderTrend]     = useState(initialOrderTrend);

  // These three are always current-period — not affected by the date filter
  const snapshot          = initialSnapshot;
  const actionable        = initialActionable;
  const topCustomers      = initialTopCustomers;
  const reorderCandidates = initialReorderCandidates;

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
        getCostPriceTrend({ from, to: null }),
        getMonthlySurplusDeficit(),
        getBreakEvenProjection(),
        getMonthlyOrderTrend({ from, to: null }),
      ]).then(([rev, cust, prod, cTrend, prof, proj, oTrend]) => {
        setRevenue(rev); setCustomers(cust); setProducts(prod);
        setCostTrend(cTrend); setProfitability(prof);
        setProjection(proj); setOrderTrend(oTrend);
      });
    });
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalBaseRevenue = products.revenue_by_base.reduce((s, i) => s + i.revenue, 0);

  const { this_month: tm, last_month: lm } = snapshot;
  const dayOfMonth  = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const paceBar = Math.min((dayOfMonth / daysInMonth) * 100, 100);

  const totalActionable = actionable.reduce((s, r) => s + r.count, 0);

  // ── Traffic lights ──────────────────────────────────────────────────────────
  const momChange = lm.revenue > 0 ? (tm.revenue - lm.revenue) / lm.revenue : null;
  const salesStatus = momChange == null ? { status: 'green', label: 'Tracking', note: '' }
    : momChange >= -0.05 ? { status: 'green', label: 'Growing',   note: `${momChange >= 0 ? '+' : ''}${fmt(momChange * 100, 1)}% MoM` }
    : momChange >= -0.30 ? { status: 'amber', label: 'Slowing',   note: `${fmt(momChange * 100, 1)}% MoM` }
    :                      { status: 'red',   label: 'Declining', note: `${fmt(momChange * 100, 1)}% MoM` };

  const repeatRate = customers.repeat_rate;
  const customerStatus = repeatRate >= 40 ? { status: 'green', label: 'Healthy',     note: `${fmt(repeatRate, 1)}% repeat` }
    : repeatRate >= 20  ? { status: 'amber', label: 'Building',    note: `${fmt(repeatRate, 1)}% repeat` }
    :                     { status: 'red',   label: 'Low loyalty', note: `${fmt(repeatRate, 1)}% repeat` };

  const lastCost = costTrend[costTrend.length - 1];
  const unitMargin = lastCost?.avg_selling_price > 0
    ? (lastCost.avg_selling_price - lastCost.cost_price_per_soap) / lastCost.avg_selling_price : null;
  const opsStatus = unitMargin == null ? { status: 'amber', label: 'No data', note: '' }
    : unitMargin >= 0.40 ? { status: 'green', label: 'Healthy margin', note: `${fmt(unitMargin * 100, 1)}% per unit` }
    : unitMargin >= 0.20 ? { status: 'amber', label: 'Tight margin',   note: `${fmt(unitMargin * 100, 1)}% per unit` }
    :                      { status: 'red',   label: 'Low margin',     note: `${fmt(unitMargin * 100, 1)}% per unit` };

  const pl = revenue.profit_loss;
  const profitStatus = pl > 0                              ? { status: 'green', label: 'In profit',      note: `+${fmtCurrency(pl)}` }
    : pl > -(revenue.total_revenue * 0.1)                  ? { status: 'amber', label: 'Near breakeven', note: fmtCurrency(pl) }
    :                                                        { status: 'red',   label: 'At a loss',      note: fmtCurrency(pl) };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '28px' : '34px', color: '#1B4332', margin: '0 0 4px 0' }}>Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Business health at a glance</p>
        </div>
        <div style={{ display: 'flex', background: '#FFFFFF', padding: '4px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
          {['All Time', 'This Year', 'Last 90 Days', 'Last 30 Days'].map((label) => (
            <button key={label} onClick={() => handleFilterChange(label)} style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, border: 'none', background: filter === label ? '#1B4332' : 'transparent', color: filter === label ? '#FFFFFF' : '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── THIS MONTH ──────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="This Month" icon={ShoppingBag} accentColor="#1B4332" status={salesStatus.status} statusLabel={salesStatus.label} statusNote={salesStatus.note} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <DeltaCard label="Revenue"    value={fmtCurrency(tm.revenue)} delta={tm.revenue - lm.revenue} dayOfMonth={dayOfMonth} color="#1B4332" format="currency" loading={false} isMobile={isMobile} />
          <DeltaCard label="Orders"     value={fmtNum(tm.orders)}       delta={tm.orders  - lm.orders}  dayOfMonth={dayOfMonth} color="#1B4332" format="number"   loading={false} isMobile={isMobile} />
          <DeltaCard label="Soaps Sold" value={fmtNum(tm.soaps)}        delta={tm.soaps   - lm.soaps}   dayOfMonth={dayOfMonth} color="#1B4332" format="number"   loading={false} isMobile={isMobile} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {/* Monthly pace card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Month Progress</div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>{fmtCurrency(tm.revenue)}</span>
              <span style={{ fontSize: '13px', color: '#6B7280', marginLeft: '8px' }}>so far</span>
            </div>
            {/* Day-of-month progress bar */}
            <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', width: `${paceBar}%`, background: '#D1FAE5', borderRadius: '3px', position: 'relative' }}>
                <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '3px', background: '#1B4332', borderRadius: '2px' }} />
              </div>
            </div>
            {/* Context — no projection, just reference points */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280' }}>
              <span>Day {dayOfMonth} of {daysInMonth}</span>
              <span>Last month <strong style={{ color: '#374151' }}>{fmtCurrency(lm.revenue)}</strong></span>
            </div>
            {projection.avgMonthlyRevenue > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                6-month avg <strong style={{ color: '#374151' }}>{fmtCurrency(projection.avgMonthlyRevenue)}</strong>
              </div>
            )}
          </div>

          {/* Actionable orders */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px' }}>
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
                    <div key={row.status} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: meta.bg, borderRadius: '8px' }}>
                      <StatusIcon size={14} color={meta.color} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', flex: 1 }}>{row.status}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: meta.color }}>{row.count}</span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>{fmtCurrency(row.value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── PRODUCTS ────────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="Products" icon={Package} accentColor="#0F766E" status={opsStatus.status} statusLabel={opsStatus.label} statusNote={opsStatus.note} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '20px' }}>

          <ChartCard title="Top Products by Revenue" subtitle="Revenue earned per product" loading={isPending} empty={products.top_products.length === 0} icon={Package} isMobile={isMobile}>
            <div style={{ height: isMobile ? '260px' : '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={[...products.top_products].sort((a, b) => b.revenue - a.revenue)} margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151' }} width={isMobile ? 80 : 110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#0F766E" radius={[0, 6, 6, 0]}>
                    {products.top_products.map((_, i) => (
                      <Cell key={i} fill={['#0F766E','#2D9D8F','#14B8A6','#5EEAD4','#99F6E4'][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* ASP summary row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {[...products.top_products].sort((a, b) => b.revenue - a.revenue).slice(0, 4).map((p) => {
                const asp = p.units_sold > 0 ? p.revenue / p.units_sold : 0;
                return (
                  <div key={p.name} style={{ fontSize: '11px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '6px', padding: '3px 8px', color: '#166534' }}>
                    <span style={{ fontWeight: 700 }}>{p.name.split(' ')[0]}</span> · ₹{Math.round(asp)}/unit
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Revenue by Base Type" subtitle="Which soap category earns most" loading={isPending} empty={products.revenue_by_base.length === 0} icon={Package} isMobile={isMobile}>
            <div style={{ height: isMobile ? '260px' : '300px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={products.revenue_by_base.filter(d => d.revenue > 0)} dataKey="revenue" nameKey="base_type" cx="50%" cy="47%" innerRadius={isMobile ? 48 : 62} outerRadius={isMobile ? 76 : 96} paddingAngle={2}>
                    {products.revenue_by_base.filter(d => d.revenue > 0).map((entry) => (
                      <Cell key={entry.base_type} fill={BASE_COLOURS[entry.base_type] || '#9CA3AF'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(v) => { const item = products.revenue_by_base.find(d => d.base_type === v); return <span style={{ color: '#4B5563', fontSize: '11px' }}>{v}: <b>{fmtCurrency(item?.revenue)}</b></span>; }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '43%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>{fmtCurrency(totalBaseRevenue)}</div>
                <div style={{ fontSize: '10px', color: '#6B7280' }}>total</div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ─── CUSTOMERS ───────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="Customers" icon={Users} accentColor="#6B21A8" status={customerStatus.status} statusLabel={customerStatus.label} statusNote={customerStatus.note} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>

          {/* Reorder radar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: isMobile ? '20px' : '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>Reorder Radar</h3>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>Customers due or overdue to reorder</p>
              </div>
              {reorderCandidates.length > 0 && <div style={{ background: '#F5F3FF', color: '#6B21A8', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px' }}>{reorderCandidates.length} due</div>}
            </div>
            {reorderCandidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: '13px' }}>No customers due yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {reorderCandidates.map((c) => {
                  const isOverdue = c.overdue_pct >= 100;
                  const dotColor = c.overdue_pct >= 130 ? '#DC2626' : c.overdue_pct >= 100 ? '#D97706' : '#6B21A8';
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: isOverdue ? '#FFF7F7' : '#FAFAFA', borderRadius: '10px', border: `1px solid ${isOverdue ? '#FEE2E2' : '#F3F4F6'}` }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${dotColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: dotColor }}>{c.name.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.order_count} orders · last {c.days_since}d ago</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: dotColor }}>{c.overdue_pct >= 100 ? 'Overdue' : 'Due soon'}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>avg {c.avg_reorder_days}d</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top customers by LTV */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: isMobile ? '20px' : '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>Top Customers</h3>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0 0' }}>By lifetime spend</p>
            </div>
            {topCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: '13px' }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topCustomers.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < topCustomers.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
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
      </div>

      {/* ─── FINANCES ────────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <SectionHeader title="Finances" icon={DollarSign} accentColor="#DC2626" status={profitStatus.status} statusLabel={profitStatus.label} statusNote={profitStatus.note} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#DC2626' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Cost per Soap</div>
            <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {lastCost?.cost_price_per_soap > 0 ? fmtCurrency(lastCost.cost_price_per_soap) : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Cumulative recurring cost · selling {lastCost?.avg_selling_price > 0 ? fmtCurrency(lastCost.avg_selling_price) : '—'}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: pl >= 0 ? '#16A34A' : '#DC2626' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Net Profit / Loss</div>
            <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: pl >= 0 ? '#16A34A' : '#DC2626', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {pl >= 0 ? '+' : ''}{fmtCurrency(pl)}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Revenue {fmtCurrency(revenue.total_revenue)} · Expenses {fmtCurrency(revenue.total_expenses)}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: pl >= 0 ? '#16A34A' : '#DC2626' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Break-Even</div>
            <div style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {projection.flatBreakEvenMonth}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{fmtCurrency(projection.avgMonthlyRevenue)}/mo avg · {fmtCurrency(projection.gapToClose)} gap to close</div>
          </div>
        </div>

        <ChartCard title="Monthly Surplus / Deficit" subtitle="Revenue vs costs — are we making money each month?" loading={isPending} empty={profitability.length === 0} icon={DollarSign} isMobile={isMobile}>
          <div style={{ height: isMobile ? '280px' : '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitability} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis yAxisId="money" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v / 10) * 10)}`} />
                <YAxis yAxisId="soaps" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#3B82F6' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar yAxisId="money" dataKey="revenue" name="Revenue" fill="#1B4332" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="money" dataKey="recurring_costs" name="Costs" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Line yAxisId="money" type="monotone" dataKey="surplus_deficit" name="Surplus/Deficit" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
                <ReferenceLine yAxisId="money" y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

    </div>
  );
};

export default DashboardClient;
