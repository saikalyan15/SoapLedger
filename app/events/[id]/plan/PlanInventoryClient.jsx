'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { Lock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EventWorkflowNav from '../EventWorkflowNav';
import StallChecklist from './StallChecklist';
import { getEventRecommendationsAction, savePlannedInventoryAction, updateStallFeeAction } from '@/lib/actions/events';

function fmtCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

function buildRows(products, savedInventory, soldByProduct) {
  const savedMap = new Map(savedInventory.map((r) => [r.product_id, r]));
  return products.map((p) => {
    const saved = savedMap.get(p.id);
    const soldQuantity = soldByProduct[p.id] || 0;
    const defaultIncluded = saved ? saved.planned_quantity > 0 : p.recommended_quantity > 0;
    return {
      product_id: p.id,
      name: p.name,
      base_type: p.base_type,
      weight_grams: p.weight_grams,
      is_active: p.is_active,
      sold_quantity: soldQuantity,
      recommended_quantity: p.recommended_quantity,
      planned_quantity: saved ? saved.planned_quantity : p.recommended_quantity,
      unit_price: saved ? Number(saved.unit_price) : Number(p.unit_price),
      included: soldQuantity > 0 ? true : defaultIncluded,
    };
  });
}

export default function PlanInventoryClient({ event, initialRecommendations, savedInventory, soldByProduct, initialTarget, initialChecklist }) {
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState(initialTarget);
  const [rows, setRows] = useState(() => buildRows(initialRecommendations, savedInventory, soldByProduct));
  const [savedMsg, setSavedMsg] = useState('');
  const [stallFee, setStallFee] = useState(event.stall_fee ?? '');
  const [feeMsg, setFeeMsg] = useState('');

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (!map.has(r.base_type)) map.set(r.base_type, []);
      map.get(r.base_type).push(r);
    });
    return [...map.entries()];
  }, [rows]);

  const totals = useMemo(() => {
    const included = rows.filter((r) => r.included);
    const units = included.reduce((sum, r) => sum + (Number(r.planned_quantity) || 0), 0);
    const value = included.reduce((sum, r) => sum + (Number(r.planned_quantity) || 0) * (Number(r.unit_price) || 0), 0);
    return { units, value };
  }, [rows]);

  // Rough catalog-wide average price — used to turn a stall fee into a
  // minimum target *before* a plan exists yet (chicken-and-egg: the real
  // planned average price isn't known until products are chosen).
  const catalogAvgPrice = useMemo(() => {
    const active = rows.filter((r) => r.is_active);
    if (active.length === 0) return 0;
    return active.reduce((sum, r) => sum + r.unit_price, 0) / active.length;
  }, [rows]);

  // Break-even against the stall fee alone (not full COGS) — checked against
  // the actual plan's weighted average price, once products are chosen.
  const breakeven = useMemo(() => {
    const fee = Number(stallFee) || 0;
    const avgPrice = totals.units > 0 ? totals.value / totals.units : 0;
    if (fee <= 0 || avgPrice <= 0) return null;
    const units = Math.ceil(fee / avgPrice);
    return {
      units,
      avgPrice,
      pctOfPlan: totals.units > 0 ? (units / totals.units) * 100 : null,
    };
  }, [stallFee, totals]);

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

  // Entering/changing the stall fee re-derives the minimum target from it
  // (fee ÷ average price) and recomputes recommendations from that — the
  // owner can still bump the target field up afterwards for safety stock.
  const handleSaveFee = () => {
    const fee = stallFee === '' ? null : Number(stallFee);
    const minimumTarget = fee && catalogAvgPrice > 0 ? Math.ceil(fee / catalogAvgPrice) : null;
    startTransition(async () => {
      const result = await updateStallFeeAction(event.id, fee);
      setFeeMsg(result.success ? 'Saved.' : result.error || 'Could not save.');
    });
    if (minimumTarget != null && minimumTarget > target) {
      handleTargetChange(minimumTarget);
    }
  };

  const updateRow = (productId, field, value) => {
    setRows((prev) => prev.map((r) => (r.product_id === productId ? { ...r, [field]: value } : r)));
  };

  const toggleIncluded = (productId) => {
    setRows((prev) => prev.map((r) => {
      if (r.product_id !== productId || r.sold_quantity > 0) return r;
      const included = !r.included;
      // Jumping into the plan from zero planned (e.g. a newly-checked seasonal
      // soap) starts from the recommendation rather than a stale zero.
      const planned_quantity = included && r.planned_quantity === 0 ? r.recommended_quantity : r.planned_quantity;
      return { ...r, included, planned_quantity };
    }));
  };

  const handleSave = () => {
    const rowsToSubmit = rows.filter((r) => r.included).map((r) => ({
      product_id: r.product_id,
      recommended_quantity: r.recommended_quantity,
      planned_quantity: r.planned_quantity,
      unit_price: r.unit_price,
    }));
    startTransition(async () => {
      const result = await savePlannedInventoryAction(event.id, rowsToSubmit, target);
      setSavedMsg(result.success ? 'Plan saved.' : result.error || 'Could not save plan.');
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '960px', margin: '0 auto' }}>
      <EventWorkflowNav event={event} activeStep="plan" />
      <PageHeader
        title="Plan inventory"
        subtitle="Check which soaps to bring — recommendations are a starting point, not a requirement."
      />

      <StallChecklist eventId={event.id} initialChecklist={initialChecklist} />

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-4 flex-wrap mb-1">
          <label className="text-sm font-semibold font-plus-jakarta text-gray-700">Stall fee (₹)</label>
          <input
            type="number" min="0" value={stallFee}
            onChange={(e) => setStallFee(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
            placeholder="0"
          />
          <button
            onClick={handleSaveFee}
            disabled={isPending}
            className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-60"
          >
            Save
          </button>
          {feeMsg && <span className="text-xs text-[var(--color-muted)] font-plus-jakarta">{feeMsg}</span>}
        </div>
        <p className="text-xs text-[var(--color-muted)] font-plus-jakarta mt-1">Saving this sets the target below to the minimum needed to break even — bump it up afterwards if you want extra stock.</p>
        {breakeven ? (
          <p className="text-sm font-plus-jakarta text-gray-700 mt-2">
            Break-even: sell at least <strong className="text-[var(--color-primary)]">{breakeven.units} soaps</strong> (at your ~{fmtCurrency(breakeven.avgPrice)} planned average price) to cover the {fmtCurrency(stallFee)} stall fee
            {breakeven.pctOfPlan != null && <> — that's <strong>{breakeven.pctOfPlan.toFixed(0)}%</strong> of what you're planning to bring.</>}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-muted)] font-plus-jakarta mt-2">Enter the stall fee to see the minimum units you'd need to sell to cover it.</p>
        )}
      </div>

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
        <span className="text-xs text-[var(--color-muted)] font-plus-jakarta">Set from the stall fee above — raise it yourself to bring extra safety stock</span>
      </div>

      {grouped.map(([baseType, items]) => (
        <div key={baseType} className="mb-6">
          <h3 className="font-plus-jakarta font-bold text-[var(--color-primary)] text-sm uppercase tracking-wide mb-2">{baseType}</h3>
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm font-plus-jakarta">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 w-10"></th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 w-28">Recommended</th>
                  <th className="px-4 py-2 w-28">Planned</th>
                  <th className="px-4 py-2 w-28">Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.product_id} className={`border-t border-gray-100 ${r.included ? '' : 'opacity-50'}`}>
                    <td className="px-4 py-2">
                      {r.sold_quantity > 0 ? (
                        <span title="Already has sales logged — can't be removed"><Lock size={14} className="text-gray-400" /></span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={r.included}
                          onChange={() => toggleIncluded(r.product_id)}
                          className="w-4 h-4"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {r.name} {r.weight_grams ? <span className="text-gray-400">({r.weight_grams}g)</span> : null}
                      {!r.is_active && <span className="ml-2 text-[10px] uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Seasonal / inactive</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-400">{r.recommended_quantity}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min="0" value={r.planned_quantity} disabled={!r.included}
                        onChange={(e) => updateRow(r.product_id, 'planned_quantity', Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-20 disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min="0" value={r.unit_price} disabled={!r.included}
                        onChange={(e) => updateRow(r.product_id, 'unit_price', Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-20 disabled:bg-gray-50"
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
