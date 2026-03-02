'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area,
  ReferenceLine, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Package, 
  Users, ShoppingBag, DollarSign, ChevronRight, AlertTriangle, Loader2, Calendar, CheckCircle
} from 'lucide-react';
import { 
  getRevenueKPIs, 
  getRepeatCustomerRate, 
  getProductPerformance, 
  getOperationsMetrics, 
  getAvgOrderValueTrend,
  getCostPriceTrend,
  getCashFlowTrend,
  getBreakEvenProjection
} from '@/lib/queries/dashboard';
import StatusBadge from '@/components/StatusBadge';

const fmt = (n, decimals = 0) => 
  n == null ? '—' : Number(n).toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });

const BASE_COLOURS = {
  'Glycerine': '#1B4332',
  'Goat Milk': '#2D6A4F',
  'Shea Butter': '#40916C',
  'Loofah': '#52B788',
  'Travel': '#74C69D',
  'Red Wine': '#95D5B2',
  'Other': '#B7E4C7'
};

const KPICard = ({ label, value, sub, color, loading }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    transition: 'transform 0.2s',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
    <div style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
      {label}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
      {loading ? <Loader2 size={24} className="animate-spin" style={{ color: '#E5E7EB' }} /> : value}
    </div>
    <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {sub}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, loading, empty, icon: Icon }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0, fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{subtitle}</p>}
      </div>
      {Icon && (
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
          <span style={{ fontSize: '14px' }}>No data available for this period</span>
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
      minWidth: '180px',
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
            ₹{Number(p.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardClient = ({ initialRevenue, initialCustomers, initialProducts, initialOperations, initialAvgTrend, initialCostTrend, initialCashFlow, initialProjection }) => {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  
  const [revenue, setRevenue] = useState(initialRevenue);
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [operations, setOperations] = useState(initialOperations);
  const [avgTrend, setAvgTrend] = useState(initialAvgTrend);
  const [costTrend, setCostTrend] = useState(initialCostTrend);
  const [cashFlow, setCashFlow] = useState(initialCashFlow);
  const [projection, setProjection] = useState(initialProjection);

  const fetchFilteredData = async (range) => {
    const [rev, cust, prod, oper, trend, cTrend, cFlow, proj] = await Promise.all([
      getRevenueKPIs(range),
      getRepeatCustomerRate(range),
      getProductPerformance(range),
      getOperationsMetrics(range),
      getAvgOrderValueTrend(range),
      getCostPriceTrend(range),
      getCashFlowTrend(range),
      getBreakEvenProjection()
    ]);
    setRevenue(rev);
    setCustomers(cust);
    setProducts(prod);
    setOperations(oper);
    setAvgTrend(trend);
    setCostTrend(cTrend);
    setCashFlow(cFlow);
    setProjection(proj);
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

  const lastActualMonth = projection.data?.filter(p => !p.isProjected).slice(-1)[0]?.month;
  const totalBaseRevenue = products.revenue_by_base.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '36px', color: '#1B4332', margin: '0 0 8px 0' }}>
            Dashboard
          </h1>
          <p style={{ color: '#6B7280', fontSize: '16px', margin: 0 }}>Business performance and growth metrics</p>
        </div>
        <div style={{ display: 'flex', background: '#FFFFFF', padding: '4px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
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
                transition: 'all 0.2s'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: '2px', background: '#E5E7EB', marginBottom: '32px' }} />

      {/* Row 1: KPI Cards (Logical 3x3 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px' }}>
          Sales Volume
        </div>
        <KPICard label="Total Revenue" value={`₹${fmt(revenue.total_revenue)}`} sub="Money in (Delivered)" color="#1B4332" loading={isPending} />
        <KPICard label="Total Orders" value={fmt(revenue.orders_count)} sub="Count (Delivered)" color="#1B4332" loading={isPending} />
        <KPICard label="Soaps Sold" value={fmt(revenue.total_soaps_sold)} sub="Units delivered" color="#1B4332" loading={isPending} />

        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px', marginTop: '12px' }}>
          Customer Growth
        </div>
        <KPICard label="Repeat Rate" value={`${fmt(customers.repeat_rate, 1)}%`} sub={`${fmt(customers.repeat_customers)} repeat buyers`} color="#0F766E" loading={isPending} />
        <KPICard label="Re-order Window" value={`${fmt(customers.avg_reorder_days)} days`} sub="Avg. time between orders" color="#0F766E" loading={isPending} />
        <KPICard label="Avg Order Value" value={`₹${fmt(revenue.avg_order_value)}`} sub="Revenue per order" color="#0F766E" loading={isPending} />

        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px', marginTop: '12px' }}>
          Operations & Pipeline
        </div>
        <KPICard label="Cost Price Per Soap" value={revenue.cost_price_per_soap > 0 ? `₹${fmt(revenue.cost_price_per_soap)}` : "—"} sub="Cumulative average" color="#6B21A8" loading={isPending} />
        <KPICard label="Pending Revenue" value={`₹${fmt(revenue.pending_revenue || 0)}`} sub="Orders being processed" color="#6B21A8" loading={isPending} />
        <KPICard label="Pending Soaps" value={fmt(revenue.pending_soaps)} sub="Units to be produced" color="#6B21A8" loading={isPending} />
      </div>

      {/* Row 2: Cash Flow & Base Type Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Monthly Cash Flow" subtitle="Revenue vs Spend (Recurring & One-time)" loading={isPending} empty={cashFlow.length === 0} icon={DollarSign}>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={cashFlow} barCategoryGap="20%" barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="revenue" name="Revenue" fill="#1B4332" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="recurring_spend" name="Recurring Spend" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="one_time_spend" name="One-time Spend" fill="#6B21A8" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Base Type" subtitle="Distribution of sales value" loading={isPending} empty={products.revenue_by_base.length === 0} icon={Package}>
          <div style={{ height: '320px', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={products.revenue_by_base.filter(d => d.revenue > 0)}
                    dataKey="revenue"
                    nameKey="base_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {products.revenue_by_base.filter(d => d.revenue > 0).map((entry) => (
                      <Cell
                        key={entry.base_type}
                        fill={BASE_COLOURS[entry.base_type] || '#9CA3AF'}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isCurrency={true} />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>₹{fmt(totalBaseRevenue)}</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>Total</div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px 16px',
              marginTop: '16px',
              justifyContent: 'center',
            }}>
              {products.revenue_by_base.filter(d => d.revenue > 0).map(entry => (
                <div key={entry.base_type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: BASE_COLOURS[entry.base_type] || '#9CA3AF',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '12px',
                    color: '#6B7280',
                  }}>
                    {entry.base_type}
                  </span>
                  <span style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1A1A1A',
                  }}>
                    ₹{Number(entry.revenue).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Unit Cost vs Sales & AOV Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Unit Cost vs Sales Volume" subtitle="Cost price vs Avg selling price" loading={isPending} empty={costTrend.length === 0} icon={TrendingDown}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={costTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="soaps_sold" name="Units Sold" fill="#D8F3DC" yAxisId={0} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="avg_selling_price" name="Avg Selling Price" stroke="#1B4332" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cost_price_per_soap" name="Unit Cost Price" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Avg Order Value Trend" subtitle="Revenue per order (Complete Months)" loading={isPending} empty={avgTrend.length === 0} icon={TrendingUp}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={avgTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Line type="monotone" dataKey="avg_order_value" name="Avg Order Value" stroke="#1B4332" strokeWidth={2} dot={{ r: 4, fill: '#1B4332' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Top Products & Customer Loyalty */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Top Products" subtitle="By units sold" loading={isPending} empty={products.top_products.length === 0} icon={Package}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart layout="vertical" data={products.top_products} margin={{ top: 5, right: 80, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#111827', fontWeight: 600 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="units_sold" name="Units" radius={[0, 4, 4, 0]}>
                  {products.top_products.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1B4332' : '#40916C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Customer Loyalty by Month" subtitle="New vs Returning (Complete Months)" loading={isPending} empty={customers.new_vs_returning_by_month.length === 0} icon={Users}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={customers.new_vs_returning_by_month} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} content={({ payload }) => (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4A017' }}></div>
                      <span>New</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
                      <span>Returning</span>
                    </div>
                  </div>
                )} />
                <Bar dataKey="new_customers" name="New" stackId="a" fill="#D4A017" />
                <Bar dataKey="returning_customers" name="Returning" stackId="a" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Operational Efficiency Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Orders to Dispatch</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmt(operations.avg_processing_days)} days</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. processing time</div>
        </div>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Dispatch to Delivery</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmt(operations.avg_dispatch_to_delivery)} days</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. shipping time</div>
        </div>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Soaps per Dispatch</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmt(operations.avg_soaps_per_batch)} units</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. batch size</div>
        </div>
      </div>

      {/* Row 6: Break-even Projection */}
      <div style={{ marginBottom: '32px' }}>
        <ChartCard title="Break-even Projection" subtitle="Cumulative Revenue vs Expenses (incl. Compounded Growth)" loading={isPending} empty={!projection.data || projection.data.length === 0} icon={TrendingUp}>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={projection.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                {lastActualMonth && (
                  <ReferenceLine x={lastActualMonth} stroke="#E5E7EB" strokeDasharray="4 4" label={{ value: '← Actual   Projected →', position: 'top', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fill: '#9CA3AF' }} />
                )}
                <Legend verticalAlign="bottom" height={36} />
                <Area type="monotone" dataKey="cumRevenueUpper" stroke="none" fill="rgba(27,67,50,0.06)" connectNulls legendType="none" />
                <Area type="monotone" dataKey="cumRevenueLower" stroke="none" fill="#FFFFFF" connectNulls legendType="none" />
                <Area type="monotone" dataKey="cumRevenue" stroke="#1B4332" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Cum. Revenue" />
                <Area type="monotone" dataKey="cumExpenses" stroke="#DC2626" strokeWidth={2} fill="none" name="Cum. Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
            <div style={{ padding: '12px 16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Avg Monthly Growth (Actual)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1B4332', fontFamily: 'DM Serif Display, serif' }}>
                {projection.completeMonthsCount >= 2 
                  ? `${(projection.rawGrowthRate * 100).toFixed(1)}%` 
                  : 'Insufficient data'}
              </div>
              {projection.completeMonthsCount >= 2 && projection.rawGrowthRate > 0.20 && (
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Capped at 20% for projection</div>
              )}
            </div>
            <div style={{ padding: '12px 16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #DCFCE7', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Projected Growth Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1B4332', fontFamily: 'DM Serif Display, serif' }}>{(projection.cappedGrowthRate * 100).toFixed(1)}%</div>
              <div style={{ fontSize: '11px', color: '#2D6A4F' }}>{projection.rawGrowthRate > 0.20 ? 'Conservative capped rate' : 'Based on historical trend'}</div>
            </div>
          </div>

          {(() => {
            const bePoint = projection.data?.find((p, i) => p.cumRevenue >= p.cumExpenses && (i === 0 || projection.data[i-1].cumRevenue < projection.data[i-1].cumExpenses));
            
            const now = new Date();
            const twelveMonthsOut = new Date(now.setMonth(now.getMonth() + 12));
            const breakEvenDate = bePoint ? (bePoint.month_date || new Date(bePoint.month)) : null;
            const isSoon = breakEvenDate && breakEvenDate <= twelveMonthsOut;

            if (bePoint) {
              return (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSoon ? '#D8F3DC' : '#FEF3C7',
                  color: isSoon ? '#1B4332' : '#92400E',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  marginTop: '16px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                }}>
                  <CheckCircle size={16} />
                  Break-even: {bePoint.month} {bePoint.isProjected ? '(Projected)' : '(Achieved!)'}
                </div>
              );
            }
            return (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FEF2F2',
                color: '#DC2626',
                borderRadius: '20px',
                padding: '8px 16px',
                marginTop: '16px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                <AlertTriangle size={16} />
                Break-even: Beyond 12 months — consider reviewing pricing or costs
              </div>
            );
          })()}
        </ChartCard>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', color: '#9CA3AF', fontSize: '12px' }}>
        Last updated: {new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default DashboardClient;
