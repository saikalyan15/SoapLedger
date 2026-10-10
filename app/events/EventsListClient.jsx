'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Tent, MapPin, Calendar, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { createEventAction } from '@/lib/actions/events';

const STATUS_STYLES = {
  Planning: { bg: '#F3F4F6', text: '#374151' },
  Ready: { bg: '#DBEAFE', text: '#1E40AF' },
  'In Progress': { bg: '#D8F3DC', text: '#1B4332' },
  Completed: { bg: '#1B4332', text: '#FFFFFF' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Planning;
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '11px',
        fontWeight: 700,
        padding: '4px 12px',
        borderRadius: '20px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCurrency(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

function NewEventForm({ onClose, onCreated }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', location: '', date_from: '', date_to: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.date_from || !form.date_to) {
      setError('Name and both dates are required.');
      return;
    }
    startTransition(async () => {
      const result = await createEventAction(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      onCreated(result.eventId);
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '420px' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-dm-serif text-[var(--color-primary)]">New Event</h2>
          <button onClick={onClose} className="text-[var(--color-muted)]"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 font-plus-jakarta">
          <div>
            <label className="text-xs font-semibold text-gray-600">Event name</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="e.g. Diwali Craft Mela"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Location</label>
            <input
              type="text" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="e.g. Phoenix Mall grounds"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600">From</label>
              <input
                type="date" value={form.date_from}
                onChange={(e) => setForm({ ...form, date_from: e.target.value, date_to: form.date_to || e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600">To</label>
              <input
                type="date" value={form.date_to}
                onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
              />
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit" disabled={isPending}
            className="w-full bg-[var(--color-primary)] text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {isPending ? 'Creating…' : 'Create & plan inventory'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EventsListClient({ initialEvents }) {
  const router = useRouter();
  const [events] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader
        title="Events"
        subtitle="Plan stall inventory and capture walk-in sales — kept separate from made-to-order revenue"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold font-plus-jakarta"
          >
            <Plus size={18} /> New Event
          </button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={Tent}
          title="No events yet"
          message="Create your first event to plan how much stock to bring and start logging walk-in sales."
        />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}/plan`}
              className="block bg-white border border-[var(--color-border)] rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-plus-jakarta font-bold text-[var(--color-primary)] text-lg">{event.name}</h3>
                    <StatusPill status={event.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--color-muted)] font-plus-jakarta">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {fmtDate(event.date_from)}{event.date_from !== event.date_to ? ` – ${fmtDate(event.date_to)}` : ''}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-dm-serif text-2xl text-[var(--color-primary)]">{fmtCurrency(event.revenue)}</div>
                  <div className="text-xs text-[var(--color-muted)] font-plus-jakarta">{event.units_sold} soaps sold</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <NewEventForm
          onClose={() => setShowForm(false)}
          onCreated={(eventId) => router.push(`/events/${eventId}/plan`)}
        />
      )}
    </div>
  );
}
