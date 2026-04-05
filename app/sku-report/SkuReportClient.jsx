'use client';

import { useState } from 'react';

const BASE_COLOURS = {
  'Glycerine':   '#1B4332',
  'Goat Milk':   '#2D6A4F',
  'Shea Butter': '#40916C',
  'Loofah':      '#52B788',
  'Travel':      '#74C69D',
  'Red Wine':    '#95D5B2',
  'Other':       '#B7E4C7',
};

function TypeBadge({ type }) {
  const color = BASE_COLOURS[type] || '#6B7280';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 600,
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>{type}</span>
  );
}

const fmt = (n) => Number(n).toLocaleString('en-IN');
const fmtCurrency = (n) => `₹${Math.round(Number(n)).toLocaleString('en-IN')}`;
const formatMonth = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const th = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
  background: '#F9FAFB',
};
const thRight = { ...th, textAlign: 'right' };
const td = {
  padding: '10px 12px',
  fontSize: '13px',
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};
const tdRight = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

export default function SkuReportClient({ allTime, monthly }) {
  const [tab, setTab] = useState('alltime');

  const totalQty = allTime.reduce((s, r) => s + r.total_qty, 0);
  const totalRevenue = allTime.reduce((s, r) => s + parseFloat(r.total_revenue), 0);

  // Monthly: unique months sorted desc, show last 12
  const months = [...new Set(monthly.map(r => r.month))].sort((a, b) => b.localeCompare(a)).slice(0, 12);

  // Lookup: monthlyMap[productId][month] = qty
  const monthlyMap = {};
  for (const row of monthly) {
    if (!monthlyMap[row.product_id]) monthlyMap[row.product_id] = {};
    monthlyMap[row.product_id][row.month] = row.qty;
  }

  const tabStyle = (active) => ({
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    background: active ? '#1B4332' : 'transparent',
    color: active ? '#FFFFFF' : '#6B7280',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '4px',
        width: 'fit-content',
        marginBottom: '24px',
      }}>
        <button style={tabStyle(tab === 'alltime')} onClick={() => setTab('alltime')}>All Time</button>
        <button style={tabStyle(tab === 'monthly')} onClick={() => setTab('monthly')}>Month on Month</button>
      </div>

      {tab === 'alltime' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={th}>Type</th>
                <th style={thRight}>Price</th>
                <th style={thRight}>Qty Sold</th>
                <th style={thRight}>Orders</th>
                <th style={thRight}>Revenue</th>
                <th style={thRight}>Share %</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allTime.map((row) => {
                const share = totalQty > 0 ? (row.total_qty / totalQty * 100) : 0;
                const barWidth = totalQty > 0 ? Math.max(2, Math.round(row.total_qty / totalQty * 80)) : 0;
                return (
                  <tr key={row.id} style={{ background: row.is_active ? 'transparent' : '#FAFAFA' }}>
                    <td style={{ ...td, fontWeight: 500, color: row.is_active ? '#111827' : '#9CA3AF', minWidth: '200px' }}>
                      {row.name}
                    </td>
                    <td style={td}><TypeBadge type={row.base_type} /></td>
                    <td style={tdRight}>₹{fmt(row.unit_price)}</td>
                    <td style={{ ...tdRight, fontWeight: row.total_qty > 0 ? 600 : 400, color: row.total_qty > 0 ? '#1B4332' : '#9CA3AF' }}>
                      {fmt(row.total_qty)}
                    </td>
                    <td style={tdRight}>{row.total_orders > 0 ? fmt(row.total_orders) : '—'}</td>
                    <td style={tdRight}>{row.total_revenue > 0 ? fmtCurrency(row.total_revenue) : '—'}</td>
                    <td style={{ ...tdRight }}>
                      {share > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#E5E7EB', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${barWidth}%`, height: '100%', background: '#1B4332', borderRadius: '99px' }} />
                          </div>
                          <span style={{ minWidth: '36px', color: share >= 10 ? '#1B4332' : '#6B7280', fontWeight: share >= 10 ? 600 : 400 }}>
                            {share.toFixed(1)}%
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={td}>
                      {row.is_active
                        ? <span style={{ color: '#059669', fontSize: '11px', fontWeight: 600 }}>Active</span>
                        : <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600 }}>Archived</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F9FAFB' }}>
                <td style={{ ...td, fontWeight: 700, color: '#111827' }} colSpan={3}>Total</td>
                <td style={{ ...tdRight, fontWeight: 700, color: '#1B4332' }}>{fmt(totalQty)}</td>
                <td style={tdRight} />
                <td style={{ ...tdRight, fontWeight: 700, color: '#1B4332' }}>{fmtCurrency(totalRevenue)}</td>
                <td style={{ ...tdRight, fontWeight: 700, color: '#6B7280' }}>100%</td>
                <td style={td} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === 'monthly' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={{ ...th, minWidth: '200px' }}>Product</th>
                <th style={{ ...th, minWidth: '100px' }}>Type</th>
                {months.map(m => (
                  <th key={m} style={{ ...thRight, minWidth: '64px' }}>{formatMonth(m)}</th>
                ))}
                <th style={{ ...thRight, minWidth: '64px', borderLeft: '2px solid #E5E7EB' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {allTime.map((p) => {
                const byMonth = monthlyMap[p.id] || {};
                return (
                  <tr key={p.id} style={{ background: p.is_active ? 'transparent' : '#FAFAFA' }}>
                    <td style={{ ...td, fontWeight: 500, color: p.is_active ? '#111827' : '#9CA3AF' }}>{p.name}</td>
                    <td style={td}><TypeBadge type={p.base_type} /></td>
                    {months.map(m => {
                      const qty = byMonth[m] || 0;
                      return (
                        <td key={m} style={{
                          ...tdRight,
                          color: qty > 0 ? '#1B4332' : '#D1D5DB',
                          fontWeight: qty > 0 ? 600 : 400,
                          background: qty > 20 ? '#F0FDF4' : qty > 0 ? 'transparent' : 'transparent',
                        }}>
                          {qty > 0 ? fmt(qty) : '—'}
                        </td>
                      );
                    })}
                    <td style={{ ...tdRight, fontWeight: 700, color: p.total_qty > 0 ? '#1B4332' : '#9CA3AF', borderLeft: '2px solid #E5E7EB' }}>
                      {p.total_qty > 0 ? fmt(p.total_qty) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F9FAFB' }}>
                <td style={{ ...td, fontWeight: 700, color: '#111827' }} colSpan={2}>Monthly Total</td>
                {months.map(m => {
                  const monthTotal = monthly.filter(r => r.month === m).reduce((s, r) => s + r.qty, 0);
                  return (
                    <td key={m} style={{ ...tdRight, fontWeight: 700, color: '#1B4332' }}>
                      {monthTotal > 0 ? fmt(monthTotal) : '—'}
                    </td>
                  );
                })}
                <td style={{ ...tdRight, fontWeight: 700, color: '#1B4332', borderLeft: '2px solid #E5E7EB' }}>
                  {fmt(totalQty)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
