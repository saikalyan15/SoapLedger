'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, Cell, PieChart, Pie
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
  getAvgOrderValueTrend 
} from '@/lib/queries/dashboard';
import StatusBadge from '@/components/StatusBadge';

const fmt = (n, decimals = 0) => 
  n == null ? '—' : Number(n).toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });

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

const ChartCard = ({ title, children, loading, empty, icon: Icon, height = 'auto' }) => (
  <div style={{
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    position: 'relative',
    height: height
  }}>
    <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: '#1B4332', margin: '0 0 20px 0' }}>
      {title}
    </h3>
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

const DashboardClient = ({ initialRevenue, initialMonthly, initialCustomers, initialProducts, initialOperations, initialAvgTrend }) => {
  const [filter, setFilter] = useState('All Time');
  const [isPending, startTransition] = useTransition();
  
  const [revenue, setRevenue] = useState(initialRevenue);
  const [monthly, setMonthly] = useState(initialMonthly);
  const [customers, setCustomers] = useState(initialCustomers);
  const [products, setProducts] = useState(initialProducts);
  const [operations, setOperations] = useState(initialOperations);
  const [avgTrend, setAvgTrend] = useState(initialAvgTrend);

  const fetchFilteredData = async (range) => {
    const [rev, mon, cust, prod, oper, trend] = await Promise.all([
      getRevenueKPIs(range),
      getMonthlyRevenue(range),
      getRepeatCustomerRate(range),
      getProductPerformance(range),
      getOperationsMetrics(range),
      getAvgOrderValueTrend(range),
    ]);
    setRevenue(rev);
    setMonthly(mon);
    setCustomers(cust);
    setProducts(prod);
    setOperations(oper);
    setAvgTrend(trend);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    const now = new Date();
    let range = { from: null, to: null };

    if (newFilter === 'This Month') {
      range.from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      range.to = now.toISOString();
    } else if (newFilter === 'Last 3 Months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(now.getDate() - 90);
      range.from = threeMonthsAgo.toISOString();
      range.to = now.toISOString();
    }

    startTransition(() => {
      fetchFilteredData(range);
    });
  };

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
        gridTemplateColumns: 'repeat(5, 1fr)', 
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
          label="Avg Order Value" 
          value={`₹${fmt(revenue.avg_order_value)}`} 
          trend={revenue.aov_trend} 
          sub="Revenue per order" 
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
      </div>

      {/* Row 2: Revenue & Volume */}
      <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Revenue by Month" loading={isPending} empty={monthly.length === 0} icon={DollarSign}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} animationDuration={600}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
              <Tooltip content={<CustomTooltip isCurrency={true} />} />
              <Bar dataKey="revenue" fill="#1B4332" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Trends" loading={isPending} empty={avgTrend.length === 0} icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={avgTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} animationDuration={600}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
              <Tooltip content={<CustomTooltip decimals={0} />} />
              <Legend verticalAlign="bottom" height={36} content={({ payload }) => (
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '12px', color: '#6B7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B4332' }}></div>
                    <span>Orders</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4A017' }}></div>
                    <span>Avg Order Value</span>
                  </div>
                </div>
              )} />
              <Line yAxisId="left" type="monotone" dataKey="order_count" name="Orders" stroke="#1B4332" strokeWidth={2} dot={{ r: 4, fill: '#1B4332' }} />
              <Line yAxisId="right" type="monotone" dataKey="avg_order_value" name="Avg Value" stroke="#D4A017" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4, fill: '#D4A017' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Customers & Bases */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Customer Loyalty by Month" loading={isPending} empty={customers.new_vs_returning_by_month.length === 0} icon={Users}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={customers.new_vs_returning_by_month} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} animationDuration={600}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
              <Bar dataKey="new_customers" name="New" stackId="a" fill="#D4A017" stroke="#92400E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="returning_customers" name="Returning" stackId="a" fill="#D8F3DC" stroke="#1B4332" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Base Type" loading={isPending} empty={products.revenue_by_base.length === 0} icon={Package}>
          <div style={{ position: 'relative', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart animationDuration={600}>
                <Pie
                  data={products.revenue_by_base}
                  dataKey="revenue"
                  nameKey="base_type"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {products.revenue_by_base.map((entry) => (
                    <Cell key={entry.base_type} fill={BASE_COLOURS[entry.base_type] || BASE_COLOURS.Other} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${fmt(value)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            {!isPending && products.revenue_by_base.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: '#1B4332', lineHeight: 1 }}>
                  ₹{fmt(products.revenue_by_base.reduce((sum, b) => sum + parseFloat(b.revenue), 0))}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                  Total
                </div>
              </div>
            )}
          </div>

          {/* Manual Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', marginTop: '20px', justifyContent: 'center' }}>
            {products.revenue_by_base.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: BASE_COLOURS[entry.base_type] || BASE_COLOURS.Other }}></div>
                <span style={{ fontSize: '12px', color: '#374151', flex: 1 }}>{entry.base_type}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A1A' }}>₹{fmt(entry.revenue)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Row 4: Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '24px', marginBottom: '32px' }}>
        <ChartCard title="Top Products by Units Sold" loading={isPending} empty={products.top_products.length === 0} icon={Package}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart 
              layout="vertical" 
              data={products.top_products} 
              margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
              animationDuration={600}
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
              <Bar dataKey="units_sold" name="Units" fill="#1B4332" radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v) => `${fmt(v)} units` }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales Breakdown" loading={isPending}>
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #F3F4F6', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 10 }}>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#6B7280' }}>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Base Type</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Units</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.all_product_stats.map((p, i) => (
                  <tr key={i} style={{ 
                    borderBottom: '1px solid #F3F4F6',
                    background: i === 0 && p.units_sold > 0 ? '#FAFDF9' : p.units_sold === 0 ? '#FFFBEB' : (i % 2 === 0 ? '#FFFFFF' : '#FAFAFA'),
                    borderLeft: i === 0 && p.units_sold > 0 ? '3px solid #1B4332' : 'none'
                  }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: p.units_sold === 0 ? '#9CA3AF' : '#1A1A1A' }}>{p.name}</div>
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>{p.base_type}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {p.units_sold === 0 ? (
                        <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', whiteSpace: 'nowrap' }}>No sales</span>
                      ) : fmt(p.units_sold)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: p.units_sold === 0 ? '#9CA3AF' : '#1A1A1A' }}>₹{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Row 5: Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {[
          { title: 'Order to Dispatch', value: `${fmt(operations.avg_processing_days, 1)} days`, sub: 'Average from order date to dispatch', color: '#1B4332' },
          { title: 'Dispatch to Delivery', value: `${fmt(operations.avg_dispatch_to_delivery, 1)} days`, sub: 'Average from dispatch to delivery', color: '#0F766E' },
          { title: 'Soaps per Dispatch', value: `${fmt(operations.avg_soaps_per_batch, 1)} soaps`, sub: 'Average units per dispatch day', color: '#D4A017' },
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

const thStyle = {
  padding: '10px 12px',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6B7280',
  fontWeight: '600',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

const tdStyle = {
  padding: '10px 12px',
  fontFamily: 'Plus Jakarta Sans, sans-serif'
};

export default DashboardClient;
