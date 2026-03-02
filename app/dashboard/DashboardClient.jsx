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

const fmt = (n) => 
  n == null ? '—' : Math.round(Number(n)).toLocaleString('en-IN', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
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
            ₹{Math.round(Number(p.value)).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardClient = ({ initialRevenue, initialCustomers, initialProducts, initialOperations, initialAvgTrend, initialCostTrend, initialCashFlow, initialProjection }) => {
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
        <KPICard label="Revenue" value={`₹${fmt(revenue.total_revenue)}`} sub="Delivered" color="#1B4332" loading={isPending} isMobile={isMobile} />
        <KPICard label="Orders" value={fmt(revenue.orders_count)} sub="Delivered" color="#1B4332" loading={isPending} isMobile={isMobile} />
        <KPICard label="Soaps Sold" value={fmt(revenue.total_soaps_sold)} sub="Units" color="#1B4332" loading={isPending} isMobile={isMobile} />

        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px', marginTop: '12px' }}>
          Customer Growth
        </div>
        <KPICard label="Repeat Rate" value={`${fmt(customers.repeat_rate)}%`} sub={`${fmt(customers.repeat_customers)} repeat`} color="#0F766E" loading={isPending} isMobile={isMobile} />
        <KPICard label="Re-order" value={`${fmt(customers.avg_reorder_days)}d`} sub="Avg. gap" color="#0F766E" loading={isPending} isMobile={isMobile} />
        <KPICard label="Avg Order" value={`₹${fmt(revenue.avg_order_value)}`} sub="Per order" color="#0F766E" loading={isPending} isMobile={isMobile} />

        <div style={{ gridColumn: '1 / -1', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px', marginTop: '12px' }}>
          Operations
        </div>
        <KPICard label="Cost Price" value={revenue.cost_price_per_soap > 0 ? `₹${fmt(revenue.cost_price_per_soap)}` : "—"} sub="Avg per soap" color="#6B21A8" loading={isPending} isMobile={isMobile} />
        <KPICard label="Pending ₹" value={`₹${fmt(revenue.pending_revenue || 0)}`} sub="Pipeline" color="#6B21A8" loading={isPending} isMobile={isMobile} />
        <KPICard label="Pending Qty" value={fmt(revenue.pending_soaps)} sub="Units" color="#6B21A8" loading={isPending} isMobile={isMobile} />
      </div>

      {/* Row 2: Cash Flow & Base Type */}
      <div 
        className="chart-row-2col"
        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}
      >
        <ChartCard title="Monthly Cash Flow" subtitle="Revenue vs Spend" loading={isPending} empty={cashFlow.length === 0} icon={DollarSign} isMobile={isMobile}>
          <div style={{ height: isMobile ? '220px' : '320px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barCategoryGap="20%" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="revenue" name="Rev" fill="#1B4332" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recurring_spend" name="Spend" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Base" subtitle="Sales distribution" loading={isPending} empty={products.revenue_by_base.length === 0} icon={Package} isMobile={isMobile}>
          <div style={{ height: isMobile ? '220px' : '320px', width: '100%', display: 'flex', flexDirection: 'column' }} className="donut-container">
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
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 800, color: '#111827', fontFamily: 'DM Serif Display, serif' }}>₹{fmt(totalBaseRevenue)}</div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Unit Cost & AOV */}
      <div 
        className="chart-row-2col"
        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}
      >
        <ChartCard title="Unit Cost vs ASP" subtitle="Profitability per unit" loading={isPending} empty={costTrend.length === 0} icon={TrendingDown} isMobile={isMobile}>
          <div style={{ height: isMobile ? '200px' : '280px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={costTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
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
          <div style={{ height: isMobile ? '200px' : '280px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `₹${fmt(v)}`} />
                <Tooltip content={<CustomTooltip />} />
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
          <div style={{ height: isMobile ? '200px' : '280px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={products.top_products} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#111827' }} width={isMobile ? 80 : 100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="units_sold" name="Units" fill="#1B4332" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Customer Loyalty" subtitle="New vs Returning" loading={isPending} empty={customers.new_vs_returning_by_month.length === 0} icon={Users} isMobile={isMobile}>
          <div style={{ height: isMobile ? '200px' : '280px', width: '100%' }} className="recharts-responsive-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customers.new_vs_returning_by_month} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
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
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmt(operations.avg_processing_days)} days</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. dispatch time</div>
        </div>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Shipping</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmt(operations.avg_dispatch_to_delivery)} days</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Avg. delivery time</div>
        </div>
        <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px' }}>Batch Size</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{fmt(operations.avg_soaps_per_batch)} units</div>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
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
              <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Actual Growth</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#1B4332' }}>{Math.round(projection.rawGrowthRate * 100)}%</div>
            </div>
            <div style={{ padding: '12px 16px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #DCFCE7', flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>Projected Rate</div>
              <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#1B4332' }}>{Math.round(projection.cappedGrowthRate * 100)}%</div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardClient;
