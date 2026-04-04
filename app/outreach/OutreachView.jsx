'use client';

import { useState } from 'react';
import { MessageCircle, Copy, Check, Phone } from 'lucide-react';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 10px', borderRadius: '6px', border: '1px solid #D1D5DB',
        background: copied ? '#D8F3DC' : 'white', cursor: 'pointer',
        fontSize: '12px', fontWeight: 600,
        color: copied ? '#1B4332' : '#6B7280',
        transition: 'all 0.2s',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function OutreachView({ candidates }) {
  const [selected, setSelected] = useState(null);

  const waLink = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <MessageCircle size={22} color="#1B4332" />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1B4332' }}>Reorder Outreach</h1>
        </div>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
          Based on soaps ordered × 30 days per bar. Repeat customers also factor in their average reorder interval.
        </p>
      </div>

      {candidates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: '15px' }}>
          No customers due for reorder right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {candidates.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB',
                padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              {/* Customer row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                    <Phone size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {formatPhoneForDisplay(c.phone)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                    Last ordered: <strong>{new Date(c.last_order_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    {' '}· {c.days_since_order} days ago
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '3px' }}>
                    <span style={{ color: '#6B7280' }}>Expected to finish in </span>
                    <strong>{c.expected_days} days</strong>
                    <span style={{ marginLeft: '8px', color: '#EF4444', fontWeight: 700 }}>
                      {c.days_overdue} day{c.days_overdue !== 1 ? 's' : ''} overdue
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '3px' }}>
                    {Math.round(c.bar_equiv_soaps)} bar-equivalent soap{c.bar_equiv_soaps !== 1 ? 's' : ''} · {c.products_ordered}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={waLink(c.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px',
                      background: '#25D366', color: 'white',
                      textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                    }}
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  <button
                    onClick={() => setSelected(selected === c.id ? null : c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px',
                      border: '1px solid #1B4332', background: 'white',
                      color: '#1B4332', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <Copy size={14} /> Messages
                  </button>
                </div>
              </div>

              {/* Message variants — expand on demand */}
              {selected === c.id && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {MESSAGE_VARIANTS.map((v) => {
                    const text = v.build(c.name, c.products_ordered);
                    return (
                      <div key={v.label} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px 14px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B4332', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {v.label}
                          </span>
                          <CopyButton text={text} />
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
