'use client';

import { useState, useTransition } from 'react';
import { MessageCircle, Copy, Check, Phone, ChevronDown, ChevronUp, Calendar, Clock, Share2 } from 'lucide-react';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import { logOutreachAction, logReferralOutreachAction, markNotReadyAction, markOrderedAction } from './actions';

const BRAND = 'Healing Soil';

const MESSAGE_VARIANTS = [
  {
    label: 'Friendly',
    build: (name, products) =>
      `Hi ${name}! 😊 Hope you're doing well. It's been about a month since your last order of ${products} from ${BRAND} — your soaps should be finishing up around now! Would you like to place a reorder? Feel free to reply here and I'll get it sorted for you. 🌿`,
  },
  {
    label: 'Simple',
    build: (name, products) =>
      `Hi ${name}, this is ${BRAND}. Your ${products} order was about a month ago — just checking in to see if you'd like to reorder. Let me know!`,
  },
  {
    label: 'Warm',
    build: (name, products) =>
      `Hello ${name}! 🌸 We hope you've been enjoying your ${products}. It's been around a month, so your soaps are likely coming to an end. We'd love to have your next batch ready for you — just say the word and we'll take care of it! Thank you for your continued support. 💚 – ${BRAND}`,
  },
];

const REFERRAL_VARIANTS = [
  {
    label: 'Simple ask',
    build: (name) =>
      `Hi ${name}! Hope you're enjoying the soap. If you know someone who'd like to try it, feel free to share our page: https://healingsoil.in — we'd really appreciate it. 🌿`,
  },
  {
    label: 'Review + share',
    build: (name) =>
      `Hi ${name}! Hope the soap is working well for you. If you're happy with it, we'd love a quick review — and if you know someone else who might enjoy it, do share healingsoil.in with them. Means a lot to a small brand. 💚`,
  },
  {
    label: 'WhatsApp share',
    build: (name) =>
      `Hi ${name}! How's the soap going? If you have friends or family who'd like to try natural handmade soap, here's a link they can use: https://healingsoil.in — no pressure at all, just grateful when word spreads organically!`,
  },
];

const RESPONSE_LABELS = {
  pending:   { text: 'Awaiting reply', color: '#D97706', bg: '#FEF3C7' },
  not_ready: { text: 'Not ready yet',  color: '#7C3AED', bg: '#EDE9FE' },
  ordered:   { text: 'Ordered',        color: '#065F46', bg: '#D1FAE5' },
  no_response: { text: 'No response',  color: '#6B7280', bg: '#F3F4F6' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: copied ? '#D8F3DC' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: copied ? '#1B4332' : '#6B7280', transition: 'all 0.2s' }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function OutreachHistory({ history }) {
  if (!history || history.length === 0) return <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>No outreach logged yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {history.map((h, i) => {
        const badge = RESPONSE_LABELS[h.response] || RESPONSE_LABELS.pending;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
            <span style={{ color: '#9CA3AF', whiteSpace: 'nowrap', minWidth: '80px' }}>
              {new Date(h.outreach_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            <span style={{ background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
              {badge.text}
            </span>
            {h.follow_up_date && (
              <span style={{ color: '#6B7280' }}>
                → follow-up {new Date(h.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CustomerCard({ c, isScheduled = false }) {
  const [showMessages, setShowMessages] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotReady, setShowNotReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Suggested follow-up: remaining days in cycle, min 7
  const remainingDays = Math.max(7, (c.expected_days || 30) - (c.days_since_order || 0));
  const suggestedDate = new Date();
  suggestedDate.setDate(suggestedDate.getDate() + remainingDays);
  const [followUpDate, setFollowUpDate] = useState(suggestedDate.toISOString().split('T')[0]);

  const waLink = (phone) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  const handleLogOutreach = () => startTransition(() => logOutreachAction(c.id));
  const handleMarkOrdered = () => startTransition(() => markOrderedAction(c.id));
  const handleNotReady = () => startTransition(async () => {
    await markNotReadyAction(c.id, followUpDate);
    setShowNotReady(false);
  });

  const history = typeof c.outreach_history === 'string'
    ? JSON.parse(c.outreach_history)
    : (c.outreach_history || []);

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${isScheduled ? '#E9D8FD' : '#E5E7EB'}`, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{c.name}</span>
            {c.is_follow_up && (
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>Follow-up</span>
            )}
            {c.last_response && (
              <span style={{ fontSize: '11px', fontWeight: 700, background: RESPONSE_LABELS[c.last_response]?.bg, color: RESPONSE_LABELS[c.last_response]?.color, padding: '2px 8px', borderRadius: '10px' }}>
                {RESPONSE_LABELS[c.last_response]?.text}
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px' }}>
            <Phone size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {formatPhoneForDisplay(c.phone)}
          </div>

          {!isScheduled && (
            <>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Last ordered: <strong>{new Date(c.last_order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                {' · '}{Math.round(c.bar_equiv_soaps)} bar-equiv soap{c.bar_equiv_soaps !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '13px', marginTop: '3px' }}>
                <span style={{ color: '#6B7280' }}>Expected finish: {c.expected_days} days · </span>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>{c.days_overdue} day{c.days_overdue !== 1 ? 's' : ''} overdue</span>
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{c.products_ordered}</div>
            </>
          )}

          {isScheduled && (
            <>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} />
                Follow-up scheduled: <strong>{new Date(c.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} />
                Last contacted: {new Date(c.last_outreach_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <a href={waLink(c.phone)} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#25D366', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
            <MessageCircle size={15} /> WhatsApp
          </a>
          <button onClick={() => setShowMessages(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #1B4332', background: 'white', color: '#1B4332', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            <Copy size={14} /> Messages {showMessages ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Message variants */}
      {showMessages && (
        <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {MESSAGE_VARIANTS.map((v) => {
            const text = v.build(c.name, c.products_ordered || '');
            return (
              <div key={v.label} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.label}</span>
                  <CopyButton text={text} />
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Outreach history */}
      <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
        <button onClick={() => setShowHistory(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '12px', fontWeight: 600, padding: 0 }}>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Outreach History ({history.length})
        </button>
        {showHistory && (
          <div style={{ marginTop: '10px' }}>
            <OutreachHistory history={history} />
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleLogOutreach} disabled={isPending}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#1B4332', color: 'white', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Check size={14} /> Reached Out
        </button>

        <button onClick={() => setShowNotReady(v => !v)} disabled={isPending}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Clock size={14} /> Not Ready
        </button>

        <button onClick={handleMarkOrdered} disabled={isPending}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Check size={14} /> They Ordered
        </button>
      </div>

      {/* Not Ready date picker */}
      {showNotReady && (
        <div style={{ marginTop: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#92400E', fontWeight: 600 }}>Follow up on:</span>
          <input
            type="date"
            value={followUpDate}
            onChange={e => setFollowUpDate(e.target.value)}
            style={{ border: '1px solid #FDE68A', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', background: 'white' }}
          />
          <span style={{ fontSize: '12px', color: '#B45309' }}>
            (Suggested: {remainingDays} days remaining in cycle)
          </span>
          <button onClick={handleNotReady} disabled={isPending}
            style={{ padding: '7px 14px', borderRadius: '7px', background: '#92400E', color: 'white', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Confirm
          </button>
          <button onClick={() => setShowNotReady(false)}
            style={{ padding: '7px 14px', borderRadius: '7px', background: 'white', color: '#6B7280', border: '1px solid #E5E7EB', fontSize: '13px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function ReferralCard({ c }) {
  const [showMessages, setShowMessages] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const waLink = (phone) => `https://wa.me/${phone.replace(/\D/g, '')}`;

  const handleLog = () => startTransition(async () => {
    await logReferralOutreachAction(c.id);
    setDone(true);
  });

  if (done) {
    return (
      <div style={{ background: '#F0FFF4', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Check size={16} color="#065F46" />
        <span style={{ fontSize: '14px', color: '#065F46', fontWeight: 600 }}>{c.name} — referral ask logged.</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{c.name}</span>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px' }}>
            <Phone size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {formatPhoneForDisplay(c.phone)}
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
            Ordered <strong>{Math.round(c.days_since_order)} days ago</strong>
            {' · '}{c.products_ordered}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
            ~{c.expected_days - c.days_since_order} days of soap remaining
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <a href={waLink(c.phone)} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#25D366', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
            <MessageCircle size={15} /> WhatsApp
          </a>
          <button onClick={() => setShowMessages(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #7C3AED', background: 'white', color: '#7C3AED', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            <Copy size={14} /> Messages {showMessages ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {showMessages && (
        <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {REFERRAL_VARIANTS.map((v) => {
            const text = v.build(c.name);
            return (
              <div key={v.label} style={{ background: '#FAF5FF', borderRadius: '8px', padding: '10px 12px', border: '1px solid #E9D8FD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{v.label}</span>
                  <CopyButton text={text} />
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{text}</p>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
        <button onClick={handleLog} disabled={isPending}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#7C3AED', color: 'white', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Check size={14} /> Mark Asked
        </button>
      </div>
    </div>
  );
}

export default function OutreachView({ dueNow, scheduled, referralCandidates = [] }) {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <MessageCircle size={22} color="#1B4332" />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1B4332' }}>Reorder Outreach</h1>
        </div>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
          Timing based on soaps ordered × 30 days per bar, refined by each customer's reorder history.
        </p>
      </div>

      {/* Due Now */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1B4332', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#EF4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
            {dueNow.length}
          </span>
          Due Now
        </h2>
        {dueNow.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: '14px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            No customers due for outreach right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {dueNow.map(c => <CustomerCard key={c.id} c={c} />)}
          </div>
        )}
      </div>

      {/* Referral Ask — mid-cycle customers */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#7C3AED', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#7C3AED', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
            {referralCandidates.length}
          </span>
          Referral Ask
        </h2>
        <p style={{ margin: '0 0 14px 0', color: '#9CA3AF', fontSize: '13px' }}>
          Active customers (14+ days in, soap still running). Ask them to share your page with someone who might like it.
        </p>
        {referralCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: '14px', background: 'white', borderRadius: '12px', border: '1px dashed #E9D8FD' }}>
            No mid-cycle customers right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {referralCandidates.map(c => <ReferralCard key={c.id} c={c} />)}
          </div>
        )}
      </div>

      {/* Scheduled Follow-ups */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#6B7280', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#6B7280', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
            {scheduled.length}
          </span>
          Scheduled Follow-ups
        </h2>
        {scheduled.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: '14px', background: 'white', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
            No follow-ups scheduled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {scheduled.map(c => <CustomerCard key={c.id} c={c} isScheduled />)}
          </div>
        )}
      </div>
    </div>
  );
}
