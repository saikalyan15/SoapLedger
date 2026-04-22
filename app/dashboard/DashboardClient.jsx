'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area,
  ComposedChart, ReferenceLine, ReferenceArea
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Package, 
  Users, ShoppingBag, DollarSign, ChevronRight, AlertTriangle, Loader2, Calendar, CheckCircle,
  Factory
} from 'lucide-react';
import { 
  getRevenueKPIs, 
  getRepeatCustomerRate, 
  getProductPerformance, 
  getOperationsMetrics, 
  getAvgOrderValueTrend,
  getCostPriceTrend,
  getMonthlySurplusDeficit,
  getBreakEvenProjection,
  getMonthlyProductionData,
  getMonthlyOrderTrend
} from '@/lib/queries/dashboard';

const fmt = (n, decimals = 0) => {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

// For currency — round to nearest 10
const fmtCurrency = (n) => {
  if (n == null) return '—';
  const rounded = Math.round(Number(n) / 10) * 10;
  return `₹${rounded.toLocaleString('en-IN')}`;
};

// For days/units — whole numbers only
const fmtNum = (n) => {
  if (n == null) return '—';
  return Math.round(Number(n)).toLocaleString('en-IN');
};

const BASE_COLOURS = {
  'Glycerine': '#1B4332',
  'Goat Milk': '#2D6A4F',
  'Shea Butter': '#40916C',
  'Loofah': '#52B788',
  'Travel': '#74C69D',
  'Red Wine': '#95D5B2',
  'Other': '#B7E4C7'
};

const KPICard = ({ label, value, sub, color, loading, isMobile }) => (
  <div className="kpi-card" style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: isMobile ? '14px 16px' : '24px',
    transition: 'transform 0.2s',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
    <div style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
      {label}
    </div>
    <div className="kpi-value" style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '800', color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
      {loading ? <Loader2 size={24} className="animate-spin" style={{ color: '#E5E7EB' }} /> : value}
    </div>
    <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {sub}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, loading, empty, icon: Icon, isMobile }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    padding: isMobile ? '20px' : '32px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{subtitle}</p>}
      </div>
      {Icon && !isMobile && (
        <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '10px', color: '#1B4332' }}>
          <Icon size={20} />
        </div>
      )}
    </div>
    <div style={{ flex: 1, position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#1B4332' }} />
        </div>
      )}
      {empty && !loading ? (
        <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
          <AlertTriangle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <span style={{ fontSize: '14px' }}>No data</span>
        </div>
      ) : children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '12px 16px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      minWidth: '160px',
      zIndex: 1000,
    }}>
      <p style={{ fontWeight: 700, marginBottom: '8px', color: '#1A1A1A' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          color: p.color || p.fill,
          marginBottom: '4px',
        }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {p.name?.includes('Qty') || p.name?.includes('Units') || p.name?.includes('Soaps') || p.name === 'Orders' ? fmtNum(p.value) : fmtCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardClient = ({ initialRevenue, initialCustomers, initialProducts, initialOperations, initialAvgTrend, initialCostTrend, initialProfitability, initialProjection, initialProduction, initialOrderTrend }) => {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false); /* mobile only */

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [revenue, setRevenue] = useState(initialRevenue);
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [operations, setOperations] = useState(initialOperations);
  const [avgTrend, setAvgTrend] = useState(initialAvgTrend);
  const [costTrend, setCostTrend] = useState(initialCostTrend);
  const [profitability, setProfitability] = useState(initialProfitability);
  const [projection, setProjection] = useState(initialProjection);
  const [production, setProduction] = useState(initialProduction);
  const [orderTrend, setOrderTrend] = useState(initialOrderTrend);

  const fetchFilteredData = async (range) => {
    const [rev, cust, prod, oper, trend, cTrend, cProf, proj, prodData, oTrend] = await Promise.all([
      getRevenueKPIs(range),
      getRepeatCustomerRate(range),
      getProductPerformance(range),
      getOperationsMetrics(range),
      getAvgOrderValueTrend(range),
      getCostPriceTrend(range),
      getMonthlySurplusDeficit(),
      getBreakEvenProjection(),
      getMonthlyProductionData(range),
      getMonthlyOrderTrend(range)
    ]);
    setRevenue(rev);
    setCustomers(cust);
    setProducts(prod);
    setOperations(oper);
    setAvgTrend(trend);
    setCostTrend(cTrend);
    setProfitability(cProf);
    setProjection(proj);
    setProduction(prodData);
    setOrderTrend(oTrend);
  };

  const handleFilterChange = (label) => {
    setFilter(label);
    let from = null;
    const now = new Date();
    
    if (label === 'Last 30 Days') {
      from = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    } else if (label === 'Last 90 Days') {
      from = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
    } else if (label === 'This Year') {
      from = `${new Date().getFullYear()}-01-01`;
    }

    startTransition(() => {
      fetchFilteredData({ from, to: null });
    });
  };

  const totalBaseRevenue = products.revenue_by_base.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '100px' }} className="page-content">
      <div 
        className="order-detail-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}
      >
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: isMobile ? '28px' : '36px', color: '#1B4332', margin: '0 0 8px 0' }}>
            Dashboard
          </h1>
          <p style={{ color: '#6B7280', fontSize: isMobile ? '14px' : '16px', margin: 0 }}>Business performance metrics</p>
        </div>
        <div 
          className="date-filter-bar"
          style={{ display: 'flex', background: '#FFFFFF', padding: '4px', borderRadius: '12px', border: '1px solid #E5E7EB' }}
        >
          {['All Time', 'This Year', 'Last 90 Days', 'Last 30 Days'].map((label) => (
            <button
              key={label}
              onClick={() => handleFilterChange(label)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                background: filter === label ? '#1B4332' : 'transparent',
                color: filter === label ? '#FFFFFF' : '#6B7280',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '2px', background: '#E5E7EB', marginBottom: '32px' }} />

      {/* Row 1: KPI Cards */}
      <div 
        className="kpi-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}
      >
        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px' }}>
          Sales Volume
        </div>
        <KPICard label="Revenue" value={fmtCurrency(revenue.total_revenue)} sub="Confirmed orders" color="#1B4332" loading={isPending} isMobile={isMobile} />
        <KPICard label="Orders" value={fmtNum(revenue.orders_count)} sub="Delivered" color="#1B4332" loading={isPending} isMobile={isMobile} />
        <KPICard label="Soaps Sold" value={fmtNum(revenue.total_soaps_sold)} sub="Units confirmed" color="#1B4332" loading={isPending} isMobile={isMobile} />

        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px', marginTop: '12px' }}>
          Customer Growth
        </div>
        <KPICard label="Repeat Rate" value={`${fmt(customers.repeat_rate)}%`} sub={`${fmtNum(customers.repeat_customers)} repeat`} color="#0F766E" loading={isPending} isMobile={isMobile} />
        <KPICard label="Re-order" value={`${fmtNum(customers.avg_reorder_days)}d`} sub="Avg. gap" color="#0F766E" loading={isPending} isMobile={isMobile} />
        <KPICard label="Avg Order" value={fmtCurrency(revenue.avg_order_value)} sub="Per order" color="#0F766E" loading={isPending} isMobile={isMobile} />

        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px', marginTop: '12px' }}>
          Operations
        </div>
        <KPICard label="Cost Price" value={revenue.cost_price_per_soap > 0 ? fmtCurrency(revenue.cost_price_per_soap) : "—"} sub="Avg per soap" color="#6B21A8" loading={isPending} isMobile={isMobile} />
        <KPICard label="Pending ₹" value={fmtCurrency(revenue.pending_revenue || 0)} sub="Awaiting payment" color="#6B21A8" loading={isPending} isMobile={isMobile} />
        <KPICard label="Pending Qty" value={fmtNum(revenue.pending_soaps)} sub="Units" color="#6B21A8" loading={isPending} isMobile={isMobile} />
      </div>

      {/* Row 2: Order Volume & Profitability */}
      <div 
        className="chart-row-2col"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}
      >
        <ChartCard title="Order Volume Trend" subtitle="MoM Orders vs Revenue" loading={isPending} empty={orderTrend.length === 0} icon={ShoppingBag} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={orderTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => fmtNum(v)} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1B4332' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v/1000))}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar yAxisId="left" dataKey="order_count" name="Orders" fill="#D8F3DC" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="total_order_value" name="Revenue" stroke="#1B4332" strokeWidth={2} dot={!isMobile} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Base" subtitle="Sales distribution" loading={isPending} empty={products.revenue_by_base.length === 0} icon={Package} isMobile={isMobile}>
          <div style={{ height: isMobile ? '280px' : '360px', width: '100%', display: 'flex', flexDirection: 'column' }} className="donut-container">
            <div style={{ flex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={products.revenue_by_base.filter(d => d.revenue > 0)}
                    dataKey="revenue"
                    nameKey="base_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 50 : 65}
                    outerRadius={isMobile ? 80 : 100}
                    paddingAngle={2}
                  >
                    {products.revenue_by_base.filter(d => d.revenue > 0).map((entry) => (
                      <Cell key={entry.base_type} fill={BASE_COLOURS[entry.base_type] || '#9CA3AF'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value, entry) => {
                      const item = products.revenue_by_base.find(d => d.base_type === value);
                      return (
                        <span style={{ color: '#4B5563', fontSize: '12px' }}>
                          {value}: <span style={{ fontWeight: 600 }}>{fmtCurrency(item?.revenue)}</span>
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>{fmtCurrency(totalBaseRevenue)}</div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Monthly Profitability */}
      <div style={{ marginBottom: '32px' }}>
        <ChartCard title="Monthly Profitability" subtitle="Surplus/Deficit Trend" loading={isPending} empty={profitability.length === 0} icon={DollarSign} isMobile={isMobile}>
          <div style={{ height: isMobile ? '280px' : '360px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitability} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis yAxisId="money" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v/10)*10)}`} />
                <YAxis yAxisId="soaps" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#3B82F6' }} tickFormatter={(v) => `${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar yAxisId="money" dataKey="revenue" name="Revenue" fill="#1B4332" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="money" dataKey="recurring_costs" name="Costs" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Line yAxisId="money" type="monotone" dataKey="surplus_deficit" name="Surplus/Deficit" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
                <Line yAxisId="soaps" type="monotone" dataKey="soaps_shipped" name="Soaps Shipped" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 3" dot={{ fill: '#3B82F6', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Production Capacity Chart */}
      <div style={{ marginBottom: '32px' }}>
        <ChartCard title="Production Capacity" subtitle="Confirmed soaps vs Monthly limit" loading={isPending} empty={!production.actualData || production.actualData.length === 0} icon={Factory} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="production-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={[
                  ...production.actualData, 
                  ...(() => {
                    if (!production.actualData || production.actualData.length === 0) return [];
                    const currentMonthKey = new Date().toISOString().slice(0, 7);
                    const lastActual = production.actualData[production.actualData.length - 1];
                    
                    // If current month is incomplete, extrapolate based on days elapsed
                    let baselineSoaps;
                    if (lastActual.month_key === currentMonthKey) {
                      const dayOfMonth = new Date().getDate();
                      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                      baselineSoaps = Math.round(lastActual.soaps * (daysInMonth / dayOfMonth));
                    } else {
                      baselineSoaps = lastActual.soaps;
                    }

                    const months = [];
                    let d = new Date(lastActual.month_key + '-01');
                    for(let i=1; i<=6; i++) {
                      d.setMonth(d.getMonth() + 1);
                      months.push({
                        month: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                        projected: baselineSoaps
                      });
                    }
                    return months;
                  })()
                ]} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(v) => fmtNum(v)} />
                
                <Bar dataKey="soaps" name="Soaps Made" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {production.actualData.map((entry, index) => {
                    const threshold = Math.round(production.monthlyCapacity * 0.8);
                    const color = entry.soaps >= production.monthlyCapacity ? '#DC2626' : 
                                  entry.soaps >= threshold ? '#D4A017' : '#1B4332';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>

                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  name="Projected" 
                  stroke="#1B4332" 
                  strokeWidth={2} 
                  strokeDasharray="6 4" 
                  dot={false} 
                  connectNulls 
                />

                <ReferenceLine 
                  y={production.monthlyCapacity} 
                  stroke="#DC2626" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  label={{
                    value: `Capacity: ${production.monthlyCapacity} soaps`,
                    position: 'insideTopRight',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    fill: '#DC2626',
                  }}
                />

                <ReferenceArea 
                  y1={Math.round(production.monthlyCapacity * 0.8)} 
                  y2={production.monthlyCapacity} 
                  fill="rgba(212,160,23,0.08)" 
                  strokeOpacity={0} 
                />

                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}>
                      <p style={{ fontWeight: 700, marginBottom: '6px', color: '#1A1A1A' }}>{label}</p>
                      {payload.map(p => (
                        <div key={p.name} style={{ color: p.color, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <span>{p.name}:</span>
                          <span style={{ fontWeight: 600 }}>{fmtNum(p.value)} soaps</span>
                        </div>
                      ))}
                      <div style={{ color: '#DC2626', marginTop: '4px', fontSize: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '4px' }}>
                        Capacity: {production.monthlyCapacity} soaps
                      </div>
                    </div>
                  );
                }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="breakeven-stats" style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
            {(() => {
              const lastMonthSoaps = production.actualData[production.actualData.length - 1]?.soaps || 0;
              const lastMonthName = production.actualData[production.actualData.length - 1]?.month || 'this month';
              const threshold = Math.round(production.monthlyCapacity * 0.8);
              return (
                <>
                  <div style={{ padding: '12px 16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Capacity Utilisation</div>
                    <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#1B4332' }}>
                      {Math.round((lastMonthSoaps / production.monthlyCapacity) * 100)}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{lastMonthSoaps} of {production.monthlyCapacity} soaps in {lastMonthName}</div>
                  </div>
                  <div style={{ 
                    padding: '12px 16px', 
                    background: lastMonthSoaps >= production.monthlyCapacity ? '#FEF2F2' : lastMonthSoaps >= threshold ? '#FFFBEB' : '#F0FDF4', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: lastMonthSoaps >= production.monthlyCapacity ? '#FEE2E2' : lastMonthSoaps >= threshold ? '#FEF3C7' : '#DCFCE7',
                    flex: 1 
                  }}>
                    <div style={{ fontSize: '11px', color: lastMonthSoaps >= threshold ? '#92400E' : '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>At Current Rate</div>
                    <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#1B4332' }}>
                      {lastMonthSoaps >= production.monthlyCapacity ? 'At capacity now' : 
                       lastMonthSoaps >= threshold ? 'Approaching capacity' : 'Within capacity'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Update capacity in Settings when you scale</div>
                  </div>
                </>
              );
            })()}
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Unit Cost & AOV */}
      <div 
        className="chart-row-2col"
        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}
      >
        <ChartCard title="Unit Cost vs ASP" subtitle="Profitability per unit" loading={isPending} empty={costTrend.length === 0} icon={TrendingDown} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={costTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v/10)*10)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="soaps_sold" name="Units" fill="#D8F3DC" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="avg_selling_price" name="ASP" stroke="#1B4332" strokeWidth={2} dot={!isMobile} />
                <Line type="monotone" dataKey="cost_price_per_soap" name="Cost" stroke="#DC2626" strokeWidth={2} dot={!isMobile} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Avg Order Value" subtitle="Revenue trend" loading={isPending} empty={avgTrend.length === 0} icon={TrendingUp} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v/10)*10)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Line type="monotone" dataKey="avg_order_value" name="AOV" stroke="#1B4332" strokeWidth={2} dot={!isMobile} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Top Products & Loyalty */}
      <div 
        className="chart-row-2col"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}
      >
        <ChartCard title="Top Products" subtitle="By units sold" loading={isPending} empty={products.top_products.length === 0} icon={Package} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={products.top_products} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#111827' }} width={isMobile ? 80 : 100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="units_sold" name="Units" fill="#1B4332" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Customer Loyalty" subtitle="New vs Returning" loading={isPending} empty={customers.new_vs_returning_by_month.length === 0} icon={Users} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customers.new_vs_returning_by_month} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => fmtNum(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="new_customers" name="New" stackId="a" fill="#D4A017" />
                <Bar dataKey="returning_customers" name="Repeat" stackId="a" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Operational Efficiency */}
      <div 
        className="operations-cards"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}
      >
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Processing</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmtNum(operations.avg_processing_days)} days</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. dispatch time</div>
        </div>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Shipping</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmtNum(operations.avg_dispatch_to_delivery)} days</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. delivery time</div>
        </div>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Batch Size</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmtNum(operations.avg_soaps_per_batch)} units</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. per order</div>
        </div>
      </div>

      {/* Row 6: Break-even Projection */}
      <div style={{ marginBottom: '32px' }}>
        <ChartCard title="Break-even Projection" subtitle="Rev vs Exp" loading={isPending} empty={!projection.data} icon={TrendingUp} isMobile={isMobile}>
          <div style={{ height: isMobile ? '240px' : '320px', width: '100%' }} className="breakeven-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmtNum(Math.round(v/1000))}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Area type="monotone" dataKey="cumRevenue" stroke="#1B4332" strokeWidth={2} fill="#D8F3DC" fillOpacity={0.4} name="Revenue" />
                <Area type="monotone" dataKey="cumExpenses" stroke="#DC2626" strokeWidth={2} fill="none" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div 
            className="breakeven-stats"
            style={{ display: 'flex', gap: '24px', marginTop: '16px' }}
          >
            <div style={{ padding: '12px 16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Current Run Rate</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#1B4332' }}>
                {fmtCurrency(projection.currentRunRate)} / month
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{projection.runRateNote}</div>
            </div>
            <div style={{ padding: '12px 16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #DCFCE7', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>At Current Run Rate</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#1B4332' }}>
                {projection.flatBreakEvenMonth}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>
                {fmtCurrency(projection.monthlyContribution)}/mo surplus closing {fmtCurrency(projection.gapToClose)} gap
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardClient;
