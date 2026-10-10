'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { getEventRecommendationsAction, savePlannedInventoryAction } from '@/lib/actions/events';

function fmtCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

function buildRows(products, savedInventory) {
  const savedMap = new Map(savedInventory.map((r) => [r.product_id, r]));
  return products.map((p) => {
    const saved = savedMap.get(p.id);
    return {
      product_id: p.id,
      name: p.name,
      base_type: p.base_type,
      weight_grams: p.weight_grams,
      recommended_quantity: p.recommended_quantity,
      planned_quantity: saved ? saved.planned_quantity : p.recommended_quantity,
      unit_price: saved ? Number(saved.unit_price) : Number(p.unit_price),
    };
  });
}

export default function PlanInventoryClient({ event, initialRecommendations, savedInventory, initialTarget }) {
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState(initialTarget);
  const [rows, setRows] = useState(() => buildRows(initialRecommendations, savedInventory));
  const [savedMsg, setSavedMsg] = useState('');

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (!map.has(r.base_type)) map.set(r.base_type, []);
      map.get(r.base_type).push(r);
    });
    return [...map.entries()];
  }, [rows]);

  const totals = useMemo(() => {
    const units = rows.reduce((sum, r) => sum + (Number(r.planned_quantity) || 0), 0);
    const value = rows.reduce((sum, r) => sum + (Number(r.planned_quantity) || 0) * (Number(r.unit_price) || 0), 0);
    return { units, value };
  }, [rows]);

  const handleTargetChange = (newTarget) => {
    setTarget(newTarget);
    startTransition(async () => {
      const result = await getEventRecommendationsAction(event.id, newTarget);
      if (result.recommendations) {
        setRows((prevRows) => {
          const recMap = new Map(result.recommendations.map((r) => [r.id, r.recommended_quantity]));
          return prevRows.map((row) => ({ ...row, recommended_quantity: recMap.get(row.product_id) ?? row.recommended_quantity }));
        });
      }
    });
  };

  const updateRow = (productId, field, value) => {
    setRows((prev) => prev.map((r) => (r.product_id === productId ? { ...r, [field]: value } : r)));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await savePlannedInventoryAction(event.id, rows);
      setSavedMsg(result.success ? 'Plan saved.' : result.error || 'Could not save plan.');
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '960px', margin: '0 auto' }}>
      <Link href="/events" className="text-sm text-[var(--color-muted)] font-plus-jakarta flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> All events
      </Link>
      <PageHeader
        title={`Plan: ${event.name}`}
        subtitle="Recommended quantities are based on past sales — edit any number freely."
        action={
          <div className="flex gap-2">
            <Link href={`/events/${event.id}/sell`} className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta">
              <ShoppingCart size={16} /> Sell
            </Link>
            <Link href={`/events/${event.id}/summary`} className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta">
              <ClipboardList size={16} /> Summary
            </Link>
          </div>
        }
      />

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-semibold font-plus-jakarta text-gray-700">Target total units to bring</label>
        <input
          type="number"
          min="0"
          value={target}
          onChange={(e) => handleTargetChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
        />
        {isPending && <span className="text-xs text-[var(--color-muted)] font-plus-jakarta">Recalculating…</span>}
      </div>

      {grouped.map(([baseType, items]) => (
        <div key={baseType} className="mb-6">
          <h3 className="font-plus-jakarta font-bold text-[var(--color-primary)] text-sm uppercase tracking-wide mb-2">{baseType}</h3>
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm font-plus-jakarta">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 w-28">Recommended</th>
                  <th className="px-4 py-2 w-28">Planned</th>
                  <th className="px-4 py-2 w-28">Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.product_id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{r.name} {r.weight_grams ? <span className="text-gray-400">({r.weight_grams}g)</span> : null}</td>
                    <td className="px-4 py-2 text-gray-400">{r.recommended_quantity}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min="0" value={r.planned_quantity}
                        onChange={(e) => updateRow(r.product_id, 'planned_quantity', Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min="0" value={r.unit_price}
                        onChange={(e) => updateRow(r.product_id, 'unit_price', Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="sticky bottom-0 bg-white border border-[var(--color-border)] rounded-xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-lg">
        <div className="font-plus-jakarta">
          <div className="text-xs text-[var(--color-muted)]">Total to bring</div>
          <div className="text-xl font-dm-serif text-[var(--color-primary)]">{totals.units} units · {fmtCurrency(totals.value)}</div>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-[var(--color-muted)] font-plus-jakarta">{savedMsg}</span>}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-60"
          >
            Save Plan
          </button>
        </div>
      </div>
    </div>
  );
}
