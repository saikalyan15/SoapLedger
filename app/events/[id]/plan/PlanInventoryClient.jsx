'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EventWorkflowNav from '../EventWorkflowNav';
import StallChecklist from './StallChecklist';
import { getEventRecommendationsAction, savePlannedInventoryAction, updateStallFeeAction } from '@/lib/actions/events';

const CATEGORY_ORDER = ['Soap', 'Balm', 'Gift Set', 'Other'];

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
      product_type: p.product_type || 'Soap',
      weight_grams: p.weight_grams,
      is_active: p.is_active,
      sold_quantity: soldQuantity,
      recommended_quantity: p.recommended_quantity,
      planned_quantity: saved ? saved.planned_quantity : p.recommended_quantity,
      in_stock_quantity: saved ? (saved.in_stock_quantity || 0) : 0,
      unit_price: saved ? Number(saved.unit_price) : Number(p.unit_price),
      catalog_price: Number(p.unit_price), // original catalog price — markup is always applied from here, never compounded
      included: soldQuantity > 0 ? true : defaultIncluded,
    };
  });
}

export default function PlanInventoryClient({ event, initialRecommendations, savedInventory, soldByProduct, initialTarget, initialChecklist, productionCostPerSoap }) {
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState(initialTarget);
  const [rows, setRows] = useState(() => buildRows(initialRecommendations, savedInventory, soldByProduct));
  const [savedMsg, setSavedMsg] = useState('');
  const [stallFee, setStallFee] = useState(event.stall_fee ?? '');
  const [feeMsg, setFeeMsg] = useState('');
  const [costPerSoap, setCostPerSoap] = useState(productionCostPerSoap ? Math.round(productionCostPerSoap) : '');
  const [markupPct, setMarkupPct] = useState('');

  // Grouped by product TYPE first (Soap / Balm / Gift Set / Other) — never
  // blended into one unit count, since a soap and a balm aren't interchangeable
  // stock. base_type (ingredient family) stays as the sub-grouping within each.
  const groupedByCategory = useMemo(() => {
    const byType = new Map();
    rows.forEach((r) => {
      if (!byType.has(r.product_type)) byType.set(r.product_type, new Map());
      const byBase = byType.get(r.product_type);
      if (!byBase.has(r.base_type)) byBase.set(r.base_type, []);
      byBase.get(r.base_type).push(r);
    });
    return CATEGORY_ORDER
      .filter((type) => byType.has(type))
      .map((type) => ({ type, baseGroups: [...byType.get(type).entries()] }));
  }, [rows]);

  // Per-category subtotals — the fix for the old blended "total units" bug.
  const categoryTotals = useMemo(() => {
    const result = new Map();
    rows.filter((r) => r.included).forEach((r) => {
      if (!result.has(r.product_type)) result.set(r.product_type, { units: 0, inStock: 0, toMake: 0, value: 0 });
      const t = result.get(r.product_type);
      const planned = Number(r.planned_quantity) || 0;
      const inStock = Number(r.in_stock_quantity) || 0;
      t.units += planned;
      t.inStock += inStock;
      t.toMake += Math.max(0, planned - inStock);
      t.value += planned * (Number(r.unit_price) || 0);
    });
    return result;
  }, [rows]);

  const grandValue = useMemo(
    () => [...categoryTotals.values()].reduce((sum, t) => sum + t.value, 0),
    [categoryTotals]
  );

  const soapTotals = categoryTotals.get('Soap') || { units: 0, value: 0 };

  // Rough catalog-wide SOAP average price — used to turn a stall fee into a
  // minimum Soap target *before* a plan exists yet (chicken-and-egg: the real
  // planned average price isn't known until products are chosen). Scoped to
  // Soap only since that's the category the fee/break-even math drives.
  const catalogAvgSoapPrice = useMemo(() => {
    const active = rows.filter((r) => r.is_active && r.product_type === 'Soap');
    if (active.length === 0) return 0;
    return active.reduce((sum, r) => sum + r.catalog_price, 0) / active.length;
  }, [rows]);

  // Break-even against the stall fee, using PROFIT per unit (price − cost),
  // not gross price — checked against the actual planned Soap average price.
  const breakeven = useMemo(() => {
    const fee = Number(stallFee) || 0;
    const cost = Number(costPerSoap) || 0;
    const avgPrice = soapTotals.units > 0 ? soapTotals.value / soapTotals.units : 0;
    if (fee <= 0 || avgPrice <= 0) return null;
    const margin = avgPrice - cost;
    if (margin <= 0) return { impossible: true, avgPrice, cost };
    const units = Math.ceil(fee / margin);
    return {
      units,
      avgPrice,
      cost,
      margin,
      pctOfPlan: soapTotals.units > 0 ? (units / soapTotals.units) * 100 : null,
    };
  }, [stallFee, costPerSoap, soapTotals]);

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

  // Entering/changing the stall fee or cost re-derives the minimum Soap
  // target from profit-per-unit (fee ÷ margin) and recomputes recommendations
  // — the owner can still bump the target field up afterwards for safety stock.
  const handleSaveFee = () => {
    const fee = stallFee === '' ? null : Number(stallFee);
    const cost = Number(costPerSoap) || 0;
    const margin = catalogAvgSoapPrice - cost;
    const minimumTarget = fee && margin > 0 ? Math.ceil(fee / margin) : null;
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

  const handleApplyMarkup = () => {
    const pct = Number(markupPct) || 0;
    setRows((prev) => prev.map((r) => (
      r.included ? { ...r, unit_price: Math.round(r.catalog_price * (1 + pct / 100)) } : r
    )));
  };

  const handleSave = () => {
    const rowsToSubmit = rows.filter((r) => r.included).map((r) => ({
      product_id: r.product_id,
      recommended_quantity: r.recommended_quantity,
      planned_quantity: r.planned_quantity,
      unit_price: r.unit_price,
      in_stock_quantity: r.in_stock_quantity,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-semibold font-plus-jakarta text-gray-700">Stall fee (₹)</label>
            <input
              type="number" min="0" value={stallFee}
              onChange={(e) => setStallFee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
              placeholder="0"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-semibold font-plus-jakarta text-gray-700">Cost per soap (₹)</label>
            <input
              type="number" min="0" value={costPerSoap}
              onChange={(e) => setCostPerSoap(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24"
              placeholder="0"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--color-muted)] font-plus-jakarta mb-2">
          Cost defaults to your make-cost only (no shipping — there's none at a stall). Saving the fee sets the Soap target below to the minimum needed to break even on profit, not just revenue.
        </p>
        <button
          onClick={handleSaveFee}
          disabled={isPending}
          className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-60"
        >
          Save
        </button>
        {feeMsg && <span className="text-xs text-[var(--color-muted)] font-plus-jakarta ml-3">{feeMsg}</span>}

        {breakeven?.impossible ? (
          <p className="text-sm font-plus-jakarta text-red-600 mt-3 flex items-center gap-2">
            <AlertTriangle size={15} /> Your planned Soap price (~{fmtCurrency(breakeven.avgPrice)}) doesn't cover the {fmtCurrency(breakeven.cost)} cost — break-even isn't possible until the price is raised or cost comes down.
          </p>
        ) : breakeven ? (
          <p className="text-sm font-plus-jakarta text-gray-700 mt-3">
            Break-even: sell at least <strong className="text-[var(--color-primary)]">{breakeven.units} soaps</strong> (at ~{fmtCurrency(breakeven.margin)} profit each) to cover the {fmtCurrency(stallFee)} stall fee
            {breakeven.pctOfPlan != null && <> — that's <strong>{breakeven.pctOfPlan.toFixed(0)}%</strong> of the soaps you're planning to bring.</>}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-muted)] font-plus-jakarta mt-3">Enter the stall fee and cost to see the minimum soaps you'd need to sell to break even.</p>
        )}
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-semibold font-plus-jakarta text-gray-700">Target Soap units to bring</label>
        <input
          type="number"
          min="0"
          value={target}
          onChange={(e) => handleTargetChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28"
        />
        {isPending && <span className="text-xs text-[var(--color-muted)] font-plus-jakarta">Recalculating…</span>}
        <span className="text-xs text-[var(--color-muted)] font-plus-jakarta">Set from the stall fee above — raise it yourself to bring extra safety stock. Only drives Soap recommendations below; Balms/Gift Sets/Other are set manually.</span>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6 flex items-center gap-4 flex-wrap">
        <label className="text-sm font-semibold font-plus-jakarta text-gray-700">Markup %</label>
        <input
          type="number" value={markupPct}
          onChange={(e) => setMarkupPct(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20"
          placeholder="0"
        />
        <button
          onClick={handleApplyMarkup}
          className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta"
        >
          Apply to all checked-in items
        </button>
        <span className="text-xs text-[var(--color-muted)] font-plus-jakarta">Always computed from the catalog price, not stacked on a previous markup. Prices stay editable per row after.</span>
      </div>

      {groupedByCategory.map(({ type, baseGroups }) => {
        const subtotal = categoryTotals.get(type) || { units: 0, inStock: 0, toMake: 0, value: 0 };
        return (
          <div key={type} className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-plus-jakarta font-bold text-[var(--color-primary)] text-base">{type}</h2>
              <span className="text-xs font-plus-jakarta text-[var(--color-muted)]">
                {subtotal.units} planned · {subtotal.inStock} in stock · make {subtotal.toMake} · {fmtCurrency(subtotal.value)}
              </span>
            </div>
            {baseGroups.map(([baseType, items]) => (
              <div key={baseType} className="mb-4">
                <h3 className="font-plus-jakarta font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">{baseType}</h3>
                <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <table className="w-full text-sm font-plus-jakarta">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500">
                        <th className="px-4 py-2 w-10"></th>
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2 w-24">Recommended</th>
                        <th className="px-4 py-2 w-24">Planned</th>
                        <th className="px-4 py-2 w-24">In stock</th>
                        <th className="px-4 py-2 w-24">To make</th>
                        <th className="px-4 py-2 w-24">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => {
                        const toMake = Math.max(0, (Number(r.planned_quantity) || 0) - (Number(r.in_stock_quantity) || 0));
                        return (
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
                                className="border border-gray-300 rounded px-2 py-1 w-16 disabled:bg-gray-50"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number" min="0" value={r.in_stock_quantity} disabled={!r.included}
                                onChange={(e) => updateRow(r.product_id, 'in_stock_quantity', Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 w-16 disabled:bg-gray-50"
                              />
                            </td>
                            <td className="px-4 py-2 font-semibold text-gray-700">{r.included ? toMake : '—'}</td>
                            <td className="px-4 py-2">
                              <input
                                type="number" min="0" value={r.unit_price} disabled={!r.included}
                                onChange={(e) => updateRow(r.product_id, 'unit_price', Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 w-20 disabled:bg-gray-50"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="sticky bottom-0 bg-white border border-[var(--color-border)] rounded-xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-lg">
        <div className="font-plus-jakarta">
          <div className="text-xs text-[var(--color-muted)]">Total plan value across everything</div>
          <div className="text-xl font-dm-serif text-[var(--color-primary)]">{fmtCurrency(grandValue)}</div>
          <div className="text-xs text-[var(--color-muted)] mt-1">
            {[...categoryTotals.entries()].map(([type, t]) => `${type}: ${t.units}`).join(' · ')}
          </div>
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
