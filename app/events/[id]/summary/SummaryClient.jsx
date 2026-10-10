'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { recordClosingCountsAction, recordCashCountedAction, updateEventAction } from '@/lib/actions/events';

function fmtCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

export default function SummaryClient({ eventId, summary }) {
  const { event, items, total_revenue, total_units_sold, cash_counted } = summary;
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

  return (
    <div style={{ padding: '40px', maxWidth: '960px', margin: '0 auto' }}>
      <Link href="/events" className="text-sm text-[var(--color-muted)] font-plus-jakarta flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> All events
      </Link>
      <PageHeader
        title={`Summary: ${event.name}`}
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

      <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
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
            {items.map((i) => {
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
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2" colSpan={2}>{total_units_sold} sold</td>
              <td className="px-4 py-2" colSpan={2}></td>
              <td className="px-4 py-2">{fmtCurrency(total_revenue)}</td>
            </tr>
          </tfoot>
        </table>
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
