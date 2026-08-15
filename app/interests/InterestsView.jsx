'use client';

import { useMemo, useState, useTransition } from 'react';
import { CheckCircle2, Clock3, MessageCircle, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { setInterestContactedAction } from '@/lib/actions/interests';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function whatsappHref(interest) {
  const phone = String(interest.customer_phone || '').replace(/\D/g, '');
  const message = [
    `Hi ${interest.customer_name},`,
    '',
    'Healing Soil is accepting orders again. You had asked us to WhatsApp you about:',
    interest.products,
    '',
    'Would you still like to place this order?',
  ].join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function InterestsView({ interests }) {
  const router = useRouter();
  const [filter, setFilter] = useState('pending');
  const [pendingId, setPendingId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const filtered = useMemo(() => interests.filter((interest) => {
    if (filter === 'pending') return !interest.interest_contacted_at;
    if (filter === 'contacted') return Boolean(interest.interest_contacted_at);
    return true;
  }), [filter, interests]);
  const pendingCount = interests.filter((interest) => !interest.interest_contacted_at).length;

  function setContacted(id, contacted) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await setInterestContactedAction(id, contacted);
        router.refresh();
        setPendingId(null);
      } catch {
        alert('Could not update this interest. Please try again.');
        setPendingId(null);
      }
    });
  }

  return (
    <div className="page-content" style={{ padding: '40px' }}>
      <PageHeader
        title="Customer Interests"
        subtitle="People who asked for a WhatsApp message when website ordering reopens"
      />

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4">
        {[
          ['pending', `To contact (${pendingCount})`],
          ['contacted', 'Contacted'],
          ['all', `All (${interests.length})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 font-sans text-sm font-semibold ${
              filter === value ? 'bg-[#1B4332] text-white' : 'border border-[#E5E7EB] bg-white text-[#6B7280]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-16 text-center font-sans text-sm text-[#6B7280]">
          {filter === 'pending' ? 'No one is waiting to be contacted.' : 'No interests in this view.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((interest) => {
            const contacted = Boolean(interest.interest_contacted_at);
            const updating = isPending && pendingId === interest.id;
            return (
              <article key={interest.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl text-[#1B4332]">{interest.customer_name}</h2>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold ${
                        contacted ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}>
                        {contacted ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                        {contacted ? 'Contacted' : 'To contact'}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-sm text-[#4B5563]">{interest.customer_phone}</p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-[#374151]">{interest.products}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-sans text-xs text-[#6B7280]">
                      <span>Estimated value ₹{Math.round(Number(interest.estimated_value || 0)).toLocaleString('en-IN')}</span>
                      <span>Saved {formatDate(interest.created_at)}</span>
                      {contacted ? <span>Contacted {formatDate(interest.interest_contacted_at)}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <a
                      href={whatsappHref(interest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 font-sans text-sm font-bold text-white hover:bg-[#1ebe5d]"
                    >
                      <MessageCircle size={17} />
                      Open WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setContacted(interest.id, !contacted)}
                      disabled={updating}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1B4332] px-5 py-3 font-sans text-sm font-bold text-[#1B4332] disabled:opacity-50"
                    >
                      {contacted ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
                      {updating ? 'Updating…' : contacted ? 'Mark not contacted' : 'Mark contacted'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
