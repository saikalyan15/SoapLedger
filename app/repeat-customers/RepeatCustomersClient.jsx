'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

function fmtCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function OrderHistory({ orders }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {orders.map((o) => {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        return (
          <div key={o.order_id} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{fmtDate(o.order_date)}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>{o.status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151' }}>
                  <span>{it.product_name} × {it.quantity}</span>
                  <span style={{ color: '#6B7280' }}>{fmtCurrency(it.quantity * it.unit_price)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomerCard({ c }) {
  const [expanded, setExpanded] = useState(false);
  const orders = typeof c.orders === 'string' ? JSON.parse(c.orders) : (c.orders || []);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{c.name}</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px' }}>
            <Phone size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {c.phone}
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
            {c.order_count} orders · last ordered {fmtDate(c.last_order_date)}
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #1B4332', background: 'white', color: '#1B4332', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          <ShoppingBag size={14} /> Order History {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
          <OrderHistory orders={orders} />
        </div>
      )}
    </div>
  );
}

export default function RepeatCustomersClient({ customers }) {
  if (!customers || customers.length === 0) {
    return (
      <EmptyState
        title="No repeat customers yet"
        message="Customers who order more than once will show up here"
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {customers.map((c) => <CustomerCard key={c.id} c={c} />)}
    </div>
  );
}
