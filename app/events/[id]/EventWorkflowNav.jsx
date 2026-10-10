import Link from 'next/link';
import { ArrowLeft, ClipboardList, ShoppingCart, BarChart2 } from 'lucide-react';

const STATUS_STYLES = {
  Planning: { bg: '#F3F4F6', text: '#374151' },
  Ready: { bg: '#DBEAFE', text: '#1E40AF' },
  'In Progress': { bg: '#D8F3DC', text: '#1B4332' },
  Completed: { bg: '#1B4332', text: '#FFFFFF' },
  Cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const STEPS = [
  { key: 'plan', label: '1. Plan', sub: 'Decide what to bring', icon: ClipboardList, path: 'plan' },
  { key: 'sell', label: '2. Sell', sub: 'Log sales at the stall', icon: ShoppingCart, path: 'sell' },
  { key: 'summary', label: '3. Summary', sub: 'Reconcile & review', icon: BarChart2, path: 'summary' },
];

// Shared across plan/sell/summary so the three-step workflow (and which step
// you're on) is always visible, instead of each page having its own ad-hoc
// back link with no sense of where it sits in the sequence. `compact` drops
// the event name/status row and sub-labels — used on the sell screen, which
// is deliberately full-screen and minimal-chrome for fast tapping mid-event.
export default function EventWorkflowNav({ event, activeStep, compact = false }) {
  const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.Planning;

  return (
    <div className={compact ? 'mb-3' : 'mb-6'}>
      {!compact && (
        <>
          <Link href="/events" className="text-sm text-[var(--color-muted)] font-plus-jakarta flex items-center gap-1 mb-3 w-fit">
            <ArrowLeft size={14} /> All events
          </Link>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h1 className="text-xl font-dm-serif text-[var(--color-primary)]">{event.name}</h1>
            <span
              style={{
                backgroundColor: statusStyle.bg, color: statusStyle.text,
                fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}
            >
              {event.status}
            </span>
          </div>
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.key === activeStep;
          return (
            <Link
              key={step.key}
              href={`/events/${event.id}/${step.path}`}
              className={`flex items-center gap-2 rounded-lg font-plus-jakarta transition-colors ${compact ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}
              style={{
                background: isActive ? 'var(--color-primary)' : 'white',
                color: isActive ? 'white' : '#374151',
                border: '1px solid var(--color-border)',
              }}
            >
              <Icon size={compact ? 14 : 16} />
              {compact ? (
                <span className="text-xs font-semibold">{step.label}</span>
              ) : (
                <span>
                  <span className="block text-sm font-semibold leading-tight">{step.label}</span>
                  <span className="block text-[11px] leading-tight" style={{ opacity: isActive ? 0.85 : 0.6 }}>{step.sub}</span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
