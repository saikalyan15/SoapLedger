'use client';

import React, { useState, useTransition } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '@/components/PageHeader';
import EventWorkflowNav from '../EventWorkflowNav';
import { recordClosingCountsAction, recordCashCountedAction, updateEventAction } from '@/lib/actions/events';

function fmtCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

// Validated categorical pair (dataviz skill palette, slots 1–2: blue/orange) —
// passes CVD separation and contrast checks, distinct from the brand green
// used everywhere else so Planned/Sold never blur into "just more green".
const CHART_COLORS = { planned: '#2a78d6', sold: '#eb6834' };

function InventoryChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontFamily: '"Plus Jakarta Sans", sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <strong style={{ display: 'block', marginBottom: '4px' }}>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#374151' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            {item.name}
          </span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function InventoryVsSalesChart({ items }) {
  const data = items.map((i) => ({
    name: i.name.length > 14 ? `${i.name.slice(0, 13)}…` : i.name,
    Planned: i.planned_quantity,
    Sold: i.sold_quantity,
  }));

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold font-plus-jakarta text-gray-900 m-0">Inventory vs sales</h2>
        <p className="text-xs font-plus-jakarta text-[var(--color-muted)] mt-1 m-0">Planned stock against units actually sold, per soap</p>
      </div>
      <div style={{ height: Math.max(220, data.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid horizontal={false} stroke="#E1E0D9" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#898781' }} axisLine={{ stroke: '#C3C2B7' }} tickLine={false} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#52514E' }} axisLine={false} tickLine={false} />
            <Tooltip content={<InventoryChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', fontFamily: '"Plus Jakarta Sans", sans-serif' }} />
            <Bar dataKey="Planned" fill={CHART_COLORS.planned} radius={[0, 4, 4, 0]} barSize={16} />
            <Bar dataKey="Sold" fill={CHART_COLORS.sold} radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CATEGORY_ORDER = ['Soap', 'Balm', 'Gift Set', 'Other'];

export default function SummaryClient({ eventId, summary }) {
  const { event, items, total_revenue, cash_counted } = summary;
  const groupedByCategory = CATEGORY_ORDER
    .map((type) => ({ type, items: items.filter((i) => (i.product_type || 'Soap') === type) }))
    .filter((g) => g.items.length > 0);
  const [closingCounts, setClosingCounts] = useState(
    () => Object.fromEntries(items.map((i) => [i.product_id, i.closing_count ?? '']))
  );
  const [cashCounted, setCashCounted] = useState(cash_counted ?? '');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleSaveClosingCounts = () => {
    startTransition(async () => {
      const rows = items.map((i) => ({
        product_id: i.product_id,
        closing_count: closingCounts[i.product_id] === '' ? null : Number(closingCounts[i.product_id]),
      })).filter((r) => r.closing_count !== null);
      const result = await recordClosingCountsAction(eventId, rows);
      setMessage(result.success ? 'Closing counts saved.' : result.error);
    });
  };

  const handleSaveCash = () => {
    startTransition(async () => {
      const result = await recordCashCountedAction(eventId, cashCounted === '' ? null : Number(cashCounted));
      setMessage(result.success ? 'Cash count saved.' : result.error);
    });
  };

  const handleMarkCompleted = () => {
    startTransition(async () => {
      const result = await updateEventAction(eventId, {
        name: event.name,
        location: event.location,
        date_from: event.date_from,
        date_to: event.date_to,
        status: 'Completed',
        cash_counted: cashCounted === '' ? null : Number(cashCounted),
        notes: event.notes,
      });
      setMessage(result.success ? 'Event marked completed.' : result.error);
    });
  };

  const cashDiff = cashCounted === '' ? null : Number(cashCounted) - total_revenue;
  const stallFee = event.stall_fee == null ? null : Number(event.stall_fee);
  const feeCovered = stallFee != null ? total_revenue - stallFee : null;

  return (
    <div style={{ padding: '40px', maxWidth: '960px', margin: '0 auto' }}>
      <EventWorkflowNav event={event} activeStep="summary" />
      <PageHeader
        title="Summary & reconciliation"
        subtitle="Planned vs sold vs remaining — the full picture for this event"
        action={
          event.status !== 'Completed' && (
            <button
              onClick={handleMarkCompleted}
              disabled={isPending}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-60"
            >
              Mark Completed
            </button>
          )
        }
      />

      {stallFee != null && (
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="font-plus-jakarta">
            <div className="text-xs text-[var(--color-muted)]">Stall fee</div>
            <div className="text-lg font-dm-serif text-[var(--color-primary)]">{fmtCurrency(stallFee)}</div>
          </div>
          <div className={`font-plus-jakarta font-semibold ${feeCovered >= 0 ? 'text-[var(--color-primary)]' : 'text-red-600'}`}>
            {feeCovered >= 0
              ? `Covered — ${fmtCurrency(feeCovered)} ahead of the fee`
              : `${fmtCurrency(Math.abs(feeCovered))} short of covering the fee`}
          </div>
        </div>
      )}

      {items.length > 0 && <InventoryVsSalesChart items={items} />}

      {groupedByCategory.map(({ type, items: categoryItems }) => {
        const categorySold = categoryItems.reduce((sum, i) => sum + i.sold_quantity, 0);
        const categoryRevenue = categoryItems.reduce((sum, i) => sum + i.revenue, 0);
        return (
          <div key={type} className="mb-6">
            <h2 className="font-plus-jakarta font-bold text-[var(--color-primary)] text-base mb-2">{type}</h2>
            <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm font-plus-jakarta">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2 w-20">Planned</th>
                    <th className="px-4 py-2 w-20">Sold</th>
                    <th className="px-4 py-2 w-20">Remaining</th>
                    <th className="px-4 py-2 w-28">Closing count</th>
                    <th className="px-4 py-2 w-24">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.map((i) => {
                    const closing = closingCounts[i.product_id];
                    const variance = closing === '' || closing == null ? null : i.remaining - Number(closing);
                    return (
                      <tr key={i.product_id} className="border-t border-gray-100">
                        <td className="px-4 py-2">{i.name}{i.weight_grams ? <span className="text-gray-400"> ({i.weight_grams}g)</span> : null}</td>
                        <td className="px-4 py-2">{i.planned_quantity}</td>
                        <td className="px-4 py-2">{i.sold_quantity}</td>
                        <td className="px-4 py-2">{i.remaining}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number" min="0" value={closing}
                            onChange={(e) => setClosingCounts((prev) => ({ ...prev, [i.product_id]: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-20"
                            placeholder="—"
                          />
                          {variance != null && variance !== 0 && (
                            <span className="text-red-600 text-xs ml-2">Δ{variance > 0 ? '+' : ''}{variance}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{fmtCurrency(i.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-bold bg-gray-50">
                    <td className="px-4 py-2">{type} total</td>
                    <td className="px-4 py-2" colSpan={2}>{categorySold} sold</td>
                    <td className="px-4 py-2" colSpan={2}></td>
                    <td className="px-4 py-2">{fmtCurrency(categoryRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-6 font-plus-jakarta">
        <div className="flex items-center justify-between font-bold">
          <span>Total revenue (all categories)</span>
          <span>{fmtCurrency(total_revenue)}</span>
        </div>
        <div className="text-xs text-[var(--color-muted)] mt-1">
          {groupedByCategory.map(({ type, items: ci }) => `${type}: ${ci.reduce((s, i) => s + i.sold_quantity, 0)} sold`).join(' · ')}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleSaveClosingCounts}
          disabled={isPending}
          className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta disabled:opacity-60"
        >
          Save closing counts
        </button>
        {message && <span className="text-sm text-[var(--color-muted)] font-plus-jakarta">{message}</span>}
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-6 flex-wrap">
        <div>
          <label className="text-xs font-semibold text-gray-600">Cash counted at close (optional)</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number" min="0" value={cashCounted}
              onChange={(e) => setCashCounted(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
              placeholder="₹"
            />
            <button
              onClick={handleSaveCash}
              disabled={isPending}
              className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-semibold font-plus-jakarta"
            >
              Save
            </button>
          </div>
        </div>
        {cashDiff != null && (
          <div className="font-plus-jakarta">
            <div className="text-xs text-gray-500">vs expected revenue</div>
            <div className={`font-bold ${cashDiff === 0 ? 'text-[var(--color-primary)]' : 'text-red-600'}`}>
              {cashDiff === 0 ? 'Matches exactly' : `${cashDiff > 0 ? '+' : ''}${fmtCurrency(cashDiff)}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
