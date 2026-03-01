'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Package, 
  Users, ShoppingBag, DollarSign, ChevronRight, AlertTriangle, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { 
  getRevenueKPIs, 
  getMonthlyRevenue, 
  getRepeatCustomerRate, 
  getProductPerformance, 
  getOperationsMetrics, 
  getAvgOrderValueTrend,
  getCostPriceTrend
} from '@/lib/queries/dashboard';
import StatusBadge from '@/components/StatusBadge';

const fmt = (n, decimals = 0) => 
  n == null ? '—' : Number(n).toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });

const fmtDays = (n) => {
  if (n == null) return '—'
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`
}

const BASE_COLOURS = {
  'Goat Milk':   '#1B4332',
  'Glycerine':   '#40916C',
  'Red Wine':    '#DC2626',
  'Shea Butter': '#D4A017',
  'Travel':      '#6B7280',
  'Loofah':      '#92400E',
  'Other':       '#9CA3AF',
};

const CustomTooltip = ({ active, payload, label, isCurrency, decimals = 0 }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '10px 14px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#1A1A1A' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, margin: '2px 0' }}>
          {p.name}: {isCurrency ? `₹${fmt(p.value, decimals)}` : fmt(p.value, decimals)}
        </p>
      ))}
      {payload.length === 2 && payload[0].name === 'Avg Selling Price' && payload[1].name === 'Cost Price' && (
        <p style={{ fontWeight: 600, marginTop: 4, borderTop: '1px solid #EEE', paddingTop: 4 }}>
          Margin: ₹{fmt(payload[0].value - payload[1].value, 0)}
        </p>
      )}
    </div>
  );
};

const KPICard = ({ label, value, trend, sub, color, loading, subColor }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderLeft: `3px solid ${color}`,
    borderRadius: '12px',
    padding: '20px 24px',
    position: 'relative',
    flex: '1 1 0',
    minWidth: '180px'
  }}>
    {loading && (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Loader2 size={20} className="animate-spin" color={color} />
      </div>
    )}
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '8px', fontWeight: '600', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {label}
    </div>
    <div style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
      {value}
    </div>
    <div style={{ fontSize: '12px', color: subColor || '#6B7280', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: subColor ? '600' : '400' }}>
      {trend !== undefined && trend !== 0 && (
        <span style={{ color: trend >= 0 ? '#059669' : '#DC2626', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px', marginRight: '6px' }}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {fmt(Math.abs(trend), 1)}%
        </span>
      )}
      {sub}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, loading, empty, icon: Icon, height = 'auto' }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    position: 'relative',
    height: height
  }}>
    <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: '#1B4332', margin: '0' }}>
      {title}
    </h3>
    {subtitle && (
      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '12px', color: '#9CA3AF', margin: '4px 0 20px 0' }}>
        {subtitle}
      </p>
    )}
    {!subtitle && <div style={{ height: '20px' }} />}
    {loading && (
      <div style={{ position: 'absolute', inset: '60px 0 0 0', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Loader2 size={32} className="animate-spin" color="#1B4332" />
      </div>
    )}
    {empty ? (
      <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', gap: '12px' }}>
        {Icon && <Icon size={40} strokeWidth={1.5} />}
        <span style={{ fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No data for this period</span>
      </div>
    ) : children}
  </div>
);

const PRODUCT_BAR_COLORS = [
  '#1B4332', // Dark Green
  '#92400E', // Deep Soil
  '#2D6A4F', // Forest Green
  '#BC8A5F', // Clay / Sand
  '#40916C', // Sage Green
  '#D4A017', // Ochre / Amber
];

const DashboardClient = ({ initialRevenue, initialMonthly, initialCustomers, initialProducts, initialOperations, initialAvgTrend, initialCostTrend }) => {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  
  const [revenue, setRevenue] = useState(initialRevenue);
  const [monthly, setMonthly] = useState(initialMonthly);
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [operations, setOperations] = useState(initialOperations);
  const [avgTrend, setAvgTrend] = useState(initialAvgTrend);
  const [costTrend, setCostTrend] = useState(initialCostTrend);

  const fetchFilteredData = async (range) => {
    const [rev, mon, cust, prod, oper, trend, cTrend] = await Promise.all([
      getRevenueKPIs(range),
      getMonthlyRevenue(range),
      getRepeatCustomerRate(range),
      getProductPerformance(range),
      getOperationsMetrics(range),
      getAvgOrderValueTrend(range),
      getCostPriceTrend(range),
    ]);
    setRevenue(rev);
    setMonthly(mon);
    setCustomers(cust);
    setProducts(prod);
    setOperations(oper);
    setAvgTrend(trend);
    setCostTrend(cTrend);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    const now = new Date();
    let range = { from: null, to: null };

    const toYMD = (d) => d.toISOString().split('T')[0];

    if (newFilter === 'This Month') {
      range.from = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
      range.to = toYMD(now);
    } else if (newFilter === 'Last 3 Months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(now.getDate() - 90);
      range.from = toYMD(threeMonthsAgo);
      range.to = toYMD(now);
    } else if (newFilter === 'All Time') {
      range = { from: null, to: null };
    }

    startTransition(() => {
      fetchFilteredData(range);
    });
  };

  const totalRevenue = products.revenue_by_base.reduce((sum, b) => sum + parseFloat(b.revenue || 0), 0);
  const pieData = products.revenue_by_base
    .map(d => ({ ...d, revenue: parseFloat(d.revenue || 0) }))
    .filter(d => d.revenue > 0);

  return (
    <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '36px', color: '#1B4332', margin: '0 0 8px 0' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Healing Soil at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['This Month', 'Last 3 Months', 'All Time'].map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: filter === f ? 'none' : '1px solid #E5E7EB',
                background: filter === f ? '#1B4332' : '#FFFFFF',
                color: filter === f ? '#FFFFFF' : '#6B7280',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: '2px', background: '#E5E7EB', marginBottom: '32px' }} />

      {/* Row 1: KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <KPICard 
          label="Total Revenue" 
          value={`₹${fmt(revenue.total_revenue)}`} 
          trend={revenue.revenue_trend} 
          sub="Dispatched + Delivered" 
          color="#1B4332"
          loading={isPending}
        />
        <KPICard 
          label="Total Orders" 
          value={fmt(revenue.orders_count)} 
          sub={`${fmt(revenue.this_month_count)} this period`} 
          color="#D4A017"
          loading={isPending}
        />
        <KPICard 
          label="Soaps Sold" 
          value={fmt(revenue.total_soaps_sold)} 
          sub="Dispatched + Delivered" 
          color="#1B4332"
          loading={isPending}
        />
        <KPICard 
          label="Avg Order Value" 
          value={`₹${fmt(revenue.avg_order_value)}`} 
          trend={revenue.aov_trend} 
          sub="Revenue per order" 
          color="#6B21A8"
          loading={isPending}
        />
        <KPICard 
          label="Cost Price Per Soap" 
          value={revenue.cost_price_per_soap > 0 ? `₹${fmt(revenue.cost_price_per_soap)}` : "—"} 
          sub="Recurring spend ÷ soaps sold" 
          color="#6B21A8"
          loading={isPending}
        />
        <KPICard 
          label="Repeat Rate" 
          value={`${fmt(customers.repeat_rate, 1)}%`} 
          sub={`${fmt(customers.repeat_customers)} of ${fmt(customers.total_customers)} customers`} 
          color="#0F766E"
          loading={isPending}
        />
        <KPICard 
          label="Pending Revenue" 
          value={`₹${fmt(revenue.pending_revenue || 0)}`} 
          sub={revenue.pending_revenue > 0 ? "Awaiting dispatch" : "All clear"} 
          subColor={revenue.pending_revenue > 0 ? null : "#1B4332"}
          color="#D4A017"
          loading={isPending}
        />
        <KPICard 
          label="Pending Soaps" 
          value={fmt(revenue.pending_soaps)} 
          sub={revenue.pending_soaps > 0 ? "To be produced" : "Queue empty"} 
          color="#92400E"
          loading={isPending}
        />
      </div>

      {/* Row 2: Charts Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Revenue by Month" loading={isPending} empty={monthly.length === 0} icon={DollarSign}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Bar dataKey="revenue" name="Revenue" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cost vs Selling Price per Soap" subtitle="Monthly trend" loading={isPending} empty={costTrend.length === 0} icon={TrendingUp}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={costTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Legend verticalAlign="bottom" height={36} content={({ payload }) => (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
                      <span>Avg Selling Price</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }}></div>
                      <span>Cost Price</span>
                    </div>
                  </div>
                )} />
                
                {/* Shaded Area between lines */}
                <defs>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <Area 
                  type="monotone" 
                  dataKey="avg_selling_price" 
                  stroke="#1B4332" 
                  strokeWidth={2} 
                  fill="rgba(27,67,50,0.08)" 
                  name="Avg Selling Price"
                  dot={{ r: 4, fill: '#1B4332', stroke: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cost_price_per_soap" 
                  stroke="#DC2626" 
                  strokeWidth={2} 
                  fill="none" 
                  name="Cost Price"
                  dot={{ r: 4, fill: '#DC2626', stroke: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', fontStyle: 'italic', lineHeight: '1.4', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
            * Monthly Cost = (Recurring Expenses in Month) ÷ (Soaps Sold in Month)<br/>
            * Avg Selling Price = (Revenue in Month) ÷ (Soaps Sold in Month)
          </div>
          {costTrend.length === 1 && (
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>
              More data next month
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Product Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Revenue by Base Type" loading={isPending} empty={pieData.length === 0} icon={Package}>
          <div style={{ position: 'relative', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
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
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.base_type}
                      fill={BASE_COLOURS[entry.base_type] || '#9CA3AF'}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label — absolutely positioned */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: '20px',
                color: '#1B4332',
                lineHeight: 1.2,
              }}>
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '11px',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Total
              </div>
            </div>
          </div>

          {/* Manual legend below chart */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
            {pieData.map(entry => (
              <div key={entry.base_type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '10px', height: '10px',
                  borderRadius: '2px',
                  background: BASE_COLOURS[entry.base_type] || '#9CA3AF',
                  flexShrink: 0,
                }} />
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', color: '#6B7280' }}>
                  {entry.base_type}
                </span>
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>
                  ₹{Number(entry.revenue).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top Products by Units Sold" loading={isPending} empty={products.top_products.length === 0} icon={Package}>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart 
                layout="vertical" 
                data={products.top_products} 
                margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#1A1A1A', fontWeight: 500 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="units_sold" 
                  name="Units" 
                  radius={[0, 4, 4, 0]} 
                  label={(props) => {
                    const { x, y, width, value, payload } = props;
                    if (!payload || value === 0) return null;
                    return (
                      <text 
                        x={x + width + 8} 
                        y={y + 12} 
                        fill="#6B7280" 
                        fontSize={11} 
                        fontFamily="Plus Jakarta Sans"
                        dominantBaseline="middle"
                      >
                        {`${fmt(value)} units · ₹${fmt(payload.revenue)}`}
                      </text>
                    );
                  }}
                >
                  {products.top_products.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRODUCT_BAR_COLORS[index % PRODUCT_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Customer Loyalty */}
      <div style={{ marginBottom: '32px' }}>
        <ChartCard title="Customer Loyalty by Month" loading={isPending} empty={customers.new_vs_returning_by_month.length === 0} icon={Users}>
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
                <Bar dataKey="new_customers" name="New" stackId="a" fill="#D4A017" radius={[0, 0, 0, 0]} />
                <Bar dataKey="returning_customers" name="Returning" stackId="a" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '8px' }}>
        {[
          { title: 'Order to Dispatch', value: `${fmtDays(operations.avg_processing_days)} days`, sub: 'Average from order date to dispatch', color: '#1B4332' },
          { title: 'Dispatch to Delivery', value: `${fmtDays(operations.avg_dispatch_to_delivery)} days`, sub: 'Average from dispatch to delivery', color: '#0F766E' },
          { title: 'Soaps per Dispatch', value: `${operations.avg_soaps_per_batch ? Math.ceil(operations.avg_soaps_per_batch) : '—'} soaps`, sub: 'Average units per dispatch day', color: '#D4A017' },
        ].map((op, i) => (
          <div key={i} style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E5E7EB', 
            borderTop: `3px solid ${op.color}`,
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', fontWeight: '600' }}>{op.title}</div>
            <div style={{ fontSize: '40px', fontWeight: '700', color: '#1B4332', fontFamily: 'DM Serif Display, serif', marginBottom: '4px' }}>
              {op.value.includes('—') ? '—' : op.value}
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>{op.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', marginBottom: '32px', fontFamily: 'Plus Jakarta Sans' }}>
        * Based on estimated dispatch dates for historical orders
      </div>

      {/* Row 6: Aging Orders Alert */}
      {operations.aging_orders.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', color: '#92400E', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} />
            Needs Attention
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {operations.aging_orders.map((order) => (
              <div key={order.id} style={{
                background: '#FEF9EE',
                border: '1px solid #FDE68A',
                borderLeft: '3px solid #D4A017',
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>{order.customer_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={order.status} />
                    <span style={{ fontSize: '12px', color: order.days_waiting > 5 ? '#DC2626' : '#6B7280', fontWeight: order.days_waiting > 5 ? '600' : '400' }}>
                      {fmt(order.days_waiting)} days waiting
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/orders/${order.id}`}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#1B4332',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  View <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Last Updated */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '12px',
        color: '#9CA3AF',
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '1px solid #E5E7EB',
        marginBottom: '40px'
      }}>
        Last updated {new Date().toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
};

export default DashboardClient;
