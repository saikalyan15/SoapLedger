'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Undo2, Banknote, Smartphone, CreditCard } from 'lucide-react';
import EventWorkflowNav from '../EventWorkflowNav';
import { logEventSaleAction, undoLastEventSaleAction } from '@/lib/actions/events';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
];

function fmtCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

export default function SellClient({ event, initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [lastSoldProductId, setLastSoldProductId] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleTap = (productId) => {
    setItems((prev) => prev.map((i) => (
      i.product_id === productId ? { ...i, sold_quantity: i.sold_quantity + 1 } : i
    )));
    setLastSoldProductId(productId);
    startTransition(async () => {
      await logEventSaleAction(event.id, productId, 1, paymentMethod);
    });
  };

  const handleUndo = () => {
    if (!lastSoldProductId) return;
    const productId = lastSoldProductId;
    setItems((prev) => prev.map((i) => (
      i.product_id === productId ? { ...i, sold_quantity: Math.max(0, i.sold_quantity - 1) } : i
    )));
    setLastSoldProductId(null);
    startTransition(async () => {
      await undoLastEventSaleAction(event.id);
    });
  };

  const totalUnitsSold = items.reduce((sum, i) => sum + i.sold_quantity, 0);
  const totalRevenue = items.reduce((sum, i) => sum + i.sold_quantity * i.unit_price, 0);

  return (
    <div style={{ padding: '16px', minHeight: '100vh', background: '#F8F7F4' }}>
      <EventWorkflowNav event={event} activeStep="sell" compact />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="font-plus-jakarta font-bold text-[var(--color-primary)]">{event.name}</div>
        <div className="flex items-center gap-2">
          {PAYMENT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = paymentMethod === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold font-plus-jakarta"
                style={{
                  background: active ? 'var(--color-primary)' : 'white',
                  color: active ? 'white' : '#374151',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Icon size={15} /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-[var(--color-border)] px-5 py-3">
        <div className="font-plus-jakarta">
          <span className="text-[var(--color-muted)] text-sm">Sold today: </span>
          <span className="font-bold text-[var(--color-primary)]">{totalUnitsSold} units · {fmtCurrency(totalRevenue)}</span>
        </div>
        <button
          onClick={handleUndo}
          disabled={!lastSoldProductId || isPending}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-40"
        >
          <Undo2 size={16} /> Undo last sale
        </button>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {items.map((item) => {
          const remaining = item.planned_quantity - item.sold_quantity;
          const soldOut = remaining <= 0;
          return (
            <button
              key={item.product_id}
              onClick={() => handleTap(item.product_id)}
              disabled={soldOut}
              className="rounded-xl p-4 text-left transition-transform active:scale-95"
              style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                opacity: soldOut ? 0.4 : 1,
                minHeight: '120px',
              }}
            >
              <div className="font-plus-jakarta font-bold text-sm text-[var(--color-primary)] leading-tight mb-1">
                {item.name}{item.weight_grams ? ` (${item.weight_grams}g)` : ''}
              </div>
              <div className="font-dm-serif text-xl text-[var(--color-primary)]">{fmtCurrency(item.unit_price)}</div>
              <div className="text-xs font-plus-jakarta mt-2" style={{ color: soldOut ? '#DC2626' : '#6B7280' }}>
                {soldOut ? 'Sold out' : `${remaining} left`}
              </div>
            </button>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 text-[var(--color-muted)] font-plus-jakarta">
          No inventory planned yet. <Link href={`/events/${event.id}/plan`} className="text-[var(--color-primary)] font-semibold">Plan inventory first</Link>.
        </div>
      )}
    </div>
  );
}
