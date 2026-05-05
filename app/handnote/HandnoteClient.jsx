'use client';

import { useState } from 'react';
import { Plus, Trash2, Printer, RefreshCw, Loader2, Sparkles, Edit3, ArrowLeft, Scissors, X } from 'lucide-react';
import Link from 'next/link';

const C = {
  brand:     '#1B4332',
  pageBg:    '#FDF3E7',
  textBrown: '#4A3728',
  rule:      '#C9A876',
  muted:     '#6B7280',
};

const SANS  = '"Plus Jakarta Sans", "Inter", Arial, sans-serif';
const SERIF = '"Cormorant Garamond", "Garamond", Georgia, serif';

const DEFAULT_INTRO =
  'Every bar in this pouch is handcrafted in small batches on our farm in Goa. We grow what we can, source the rest with care, and make each batch by hand.\n\nNo shortcuts, no synthetics, no fillers. Just real ingredients chosen for how they feel on skin and what they actually do.\n\nWe hope these little bars bring a moment of quiet to your day.';

/* ══════════════════════════════════════
   COVER PAGE — green header/footer, cream body
══════════════════════════════════════ */
function CoverPage({ introText }) {
  return (
    <div className="hn-page" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Green header bar — fixed 26mm so it matches the inside page header ── */}
      <div style={{
        background: C.brand, flexShrink: 0, width: '100%', height: '26mm',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '1.5mm', boxSizing: 'border-box',
      }}>
        <img
          src="/logo/healing-soil-v2.1-transparent.png"
          alt="Healing Soil"
          style={{ width: '18mm', height: 'auto', filter: 'brightness(0) invert(1)' }}
        />
        <div style={{
          fontFamily: SANS, fontSize: '5.5pt', fontWeight: 700,
          color: 'rgba(255,255,255,0.85)', letterSpacing: '0.35em',
        }}>
          HEALING SOIL
        </div>
      </div>

      {/* ── Cream body ── */}
      <div style={{
        flex: 1, background: C.pageBg,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '6mm 7mm 5mm', overflow: 'hidden',
      }}>
        {/* Tagline */}
        <div style={{
          fontFamily: SERIF, fontStyle: 'italic', fontSize: '20pt',
          color: C.textBrown, textAlign: 'center', lineHeight: 1.35,
          marginBottom: '4mm', flexShrink: 0,
        }}>
          a little something,<br />made with love
        </div>

        {/* Gold rule */}
        <div style={{ width: '40mm', height: '0.4mm', background: C.rule, marginBottom: '5mm', flexShrink: 0 }} />

        {/* Intro paragraphs */}
        <div style={{
          fontFamily: SANS, fontSize: '8pt', fontWeight: 400,
          color: C.textBrown, textAlign: 'justify', lineHeight: 1.85,
          flex: 1, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3.5mm',
        }}>
          {introText.split('\n\n').map((para, i) => (
            <p key={i} style={{ margin: 0 }}>{para}</p>
          ))}
        </div>
      </div>

      {/* ── Green footer bar — fixed 14mm so it matches the inside page footer ── */}
      <div style={{
        background: C.brand, flexShrink: 0, width: '100%', height: '14mm',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontFamily: SANS, fontSize: '5pt', fontWeight: 600,
          color: 'rgba(255,255,255,0.8)', letterSpacing: '0.25em',
        }}>
          HANDMADE · SMALL BATCH · GOA
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════
   INSIDE PAGE — green header/footer, cream body
══════════════════════════════════════ */
function InsidePage({ soaps }) {
  return (
    <div className="hn-page" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Green header bar — fixed 26mm, same as cover ── */}
      <div style={{
        background: C.brand, flexShrink: 0, width: '100%', height: '26mm',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontFamily: SANS, fontSize: '6pt', fontWeight: 700,
          color: 'rgba(255,255,255,0.85)', letterSpacing: '0.3em',
        }}>
          WHAT'S INSIDE
        </div>
      </div>

      {/* ── Cream body ── */}
      <div style={{
        flex: 1, background: C.pageBg,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-evenly',
        padding: '4mm 8mm', overflow: 'hidden',
      }}>
        {soaps.map((soap, i) => (
          <div key={i}>
            {/* Soap name in brand green */}
            <div style={{
              fontFamily: SERIF, fontSize: '12pt', fontWeight: 600,
              color: C.brand, lineHeight: 1.2, marginBottom: '1.5mm',
            }}>
              {soap.name}
            </div>
            {/* Description */}
            <div style={{
              fontFamily: SANS, fontSize: '7.5pt', fontWeight: 400,
              color: C.textBrown, lineHeight: 1.75,
            }}>
              {soap.description || ''}
            </div>
            {/* Separator — gold rule between soaps, not after last */}
            {i < soaps.length - 1 && (
              <div style={{ width: '100%', height: '0.3mm', background: C.rule, opacity: 0.6, marginTop: '3.5mm' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Green footer bar — fixed 14mm, same as cover ── */}
      <div style={{
        background: C.brand, flexShrink: 0, width: '100%', height: '14mm',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.8mm', boxSizing: 'border-box',
      }}>
        <div style={{ fontFamily: SANS, fontSize: '5.5pt', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.05em' }}>
          healingsoil.in/shop · WhatsApp +91-7483100651
        </div>
        <div style={{ fontFamily: SANS, fontSize: '5pt', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
          @healingsoil.in on Instagram
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════
   BIFOLD PREVIEW (screen)
══════════════════════════════════════ */
function BifoldPreview({ introText, soaps, hasGenerated }) {
  if (!hasGenerated) {
    return (
      <div style={{
        width: '210mm', height: '148mm',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '10px',
        background: 'rgba(255,255,255,0.45)',
        border: '1.5px dashed #D1D5DB', borderRadius: '4px',
      }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="white" />
        </div>
        <div style={{ fontFamily: SANS, fontSize: '13px', color: C.muted, fontWeight: 600, textAlign: 'center' }}>
          Add your soaps and click<br />"Generate Handnote"
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: '10px', fontWeight: 600, color: C.muted, letterSpacing: '0.1em', textAlign: 'center', marginBottom: '8px' }}>
        OPEN — fold along the centre line, cover faces out
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', boxShadow: '0 4px 24px rgba(0,0,0,0.14)' }}>
        <InsidePage soaps={soaps} />

        {/* ── Fold indicator column ── */}
        <div style={{
          width: '28px', flexShrink: 0, background: '#F3F4F6',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '6px', position: 'relative',
        }}>
          {/* dashed centre line */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%',
            borderLeft: '1.5px dashed #9CA3AF', transform: 'translateX(-50%)',
          }} />
          {/* label */}
          <div style={{
            background: '#9CA3AF', color: 'white', borderRadius: '3px',
            fontFamily: SANS, fontSize: '8px', fontWeight: 700,
            padding: '2px 4px', letterSpacing: '0.05em', zIndex: 1,
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          }}>
            FOLD
          </div>
          <Scissors size={12} color="#9CA3AF" style={{ zIndex: 1, transform: 'rotate(90deg)' }} />
        </div>

        <CoverPage introText={introText} />
      </div>

      <div style={{ fontFamily: SANS, fontSize: '10px', color: C.muted, textAlign: 'center', marginTop: '8px' }}>
        Fold along the centre line · Cover faces out · Inside opens up · Slip into the pouch
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function HandnoteClient({ products }) {
  // soaps: { id, name, productId, description }
  const [soaps, setSoaps]           = useState([]);
  const [introText, setIntroText]   = useState(DEFAULT_INTRO);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customName, setCustomName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ done: 0, total: 0 });
  const [hasGenerated, setHasGenerated] = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [regenId, setRegenId]       = useState(null);

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
  const soapName = selectedProduct?.name || customName.trim();

  /* Add soap to list (no AI call) */
  function addSoap() {
    if (!soapName) return;
    setSoaps(prev => [...prev, {
      id:        Date.now(),
      name:      soapName,
      productId: selectedProduct?.id || null,
      baseType:  selectedProduct?.base_type || '',
      ingredients: selectedProduct?.ingredients || '',
      description: '',
    }]);
    setSelectedProductId('');
    setCustomName('');
    setHasGenerated(false);
  }

  function removeSoap(id) {
    setSoaps(prev => prev.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function updateDescription(id, description) {
    setSoaps(prev => prev.map(s => s.id === id ? { ...s, description } : s));
  }

  /* Generate descriptions one by one to avoid rate limits */
  async function generateAll() {
    if (soaps.length === 0 || generating) return;
    setGenerating(true);
    setGenProgress({ done: 0, total: soaps.length });
    try {
      for (let i = 0; i < soaps.length; i++) {
        const soap = soaps[i];
        const res = await fetch('/api/handnote/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:        soap.name,
            baseType:    soap.baseType,
            ingredients: soap.ingredients,
            notes:       '',
          }),
        });
        const data = await res.json();
        if (data.description) {
          setSoaps(prev => prev.map(s =>
            s.id === soap.id ? { ...s, description: data.description } : s
          ));
        }
        setGenProgress({ done: i + 1, total: soaps.length });
      }
      setHasGenerated(true);
    } finally {
      setGenerating(false);
    }
  }

  /* Regenerate a single soap description */
  async function regenOne(soapId) {
    const soap = soaps.find(s => s.id === soapId);
    if (!soap) return;
    setRegenId(soapId);
    try {
      const res = await fetch('/api/handnote/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: soap.name, baseType: soap.baseType, ingredients: soap.ingredients, notes: '' }),
      });
      const data = await res.json();
      if (data.description) updateDescription(soapId, data.description);
    } finally {
      setRegenId(null);
    }
  }

  const canGenerate = soaps.length > 0 && !generating;

  return (
    <div className="hn-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        @page { size: 210mm 148mm; margin: 0; }

        .hn-root {
          background: #F0EDE8;
          min-height: 100vh;
          padding: 20px;
          font-family: ${SANS};
        }

        .hn-page {
          width: 105mm;
          height: 148mm;
          background: ${C.pageBg};
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          flex-shrink: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media print {
          .no-print  { display: none !important; }
          .hn-root   { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .hn-print-sheet {
            display: flex !important;
            flex-direction: row !important;
            width: 210mm !important;
            height: 148mm !important;
          }
          .hn-fold-guide {
            display: block !important;
            width: 0 !important;
            border-left: 0.3mm dashed rgba(180,150,100,0.35) !important;
            height: 148mm !important;
            flex-shrink: 0 !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="no-print" style={{
        background: C.brand, color: 'white', padding: '14px 20px',
        borderRadius: '12px', maxWidth: '1040px', margin: '0 auto 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/labels" style={{ color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>Gift Handnote</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>
              {hasGenerated ? 'Ready to print' : soaps.length === 0 ? 'Step 1: add your soaps below' : `${soaps.length} soap${soaps.length !== 1 ? 's' : ''} added — click Generate`}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          disabled={!hasGenerated}
          style={{
            background: hasGenerated ? 'white' : 'rgba(255,255,255,0.25)',
            color: C.brand, border: 'none', padding: '9px 18px',
            borderRadius: '8px', fontWeight: 800, fontSize: '13px',
            cursor: hasGenerated ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '7px', fontFamily: SANS,
          }}
        >
          <Printer size={15} /> Print
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="no-print" style={{
        maxWidth: '1040px', margin: '0 auto',
        display: 'flex', gap: '24px', alignItems: 'flex-start',
      }}>

        {/* ── Left: config ── */}
        <div style={{ flex: '0 0 310px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Cover message */}
          <div style={card}>
            <Label>Cover message</Label>
            <textarea
              value={introText}
              onChange={e => setIntroText(e.target.value)}
              rows={7}
              style={textarea}
            />
          </div>

          {/* Add soaps */}
          <div style={card}>
            <Label>
              Add soaps{soaps.length > 0 && <span style={{ fontWeight: 400, color: C.muted, marginLeft: '6px' }}>({soaps.length} added)</span>}
            </Label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={selectedProductId}
                onChange={e => { setSelectedProductId(e.target.value); setCustomName(''); }}
                style={select}
              >
                <option value="">— Pick from your products —</option>
                {products.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name} ({p.base_type})</option>
                ))}
              </select>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>or</div>

              <input
                type="text"
                value={customName}
                placeholder="Type a custom soap name"
                onChange={e => { setCustomName(e.target.value); setSelectedProductId(''); }}
                onKeyDown={e => e.key === 'Enter' && addSoap()}
                style={input}
              />

              <button
                onClick={addSoap}
                disabled={!soapName}
                style={{
                  ...btn,
                  background: soapName ? C.brand : '#9CA3AF',
                  cursor: soapName ? 'pointer' : 'not-allowed',
                }}
              >
                <Plus size={14} /> Add Soap
              </button>
            </div>

            {/* Soap list */}
            {soaps.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {soaps.map(soap => (
                  <div key={soap.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F9FAFB', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{soap.name}</div>
                    <button onClick={() => removeSoap(soap.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={generateAll}
            disabled={!canGenerate}
            style={{
              ...btn,
              padding: '13px',
              fontSize: '14px',
              background: canGenerate ? '#D4A017' : '#9CA3AF',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              boxShadow: canGenerate ? '0 2px 12px rgba(212,160,23,0.35)' : 'none',
            }}
          >
            {generating
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {genProgress.done}/{genProgress.total} done…</>
              : <><Sparkles size={16} /> Generate Handnote</>}
          </button>

          {/* Descriptions (after generate) */}
          {hasGenerated && (
            <div style={card}>
              <Label>Edit descriptions</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {soaps.map(soap => (
                  <div key={soap.id} style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#1F2937' }}>{soap.name}</div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          onClick={() => regenOne(soap.id)}
                          title="Regenerate"
                          disabled={regenId === soap.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px', display: 'flex' }}
                        >
                          <RefreshCw size={12} style={regenId === soap.id ? { animation: 'spin 1s linear infinite' } : {}} />
                        </button>
                        <button
                          onClick={() => setEditingId(editingId === soap.id ? null : soap.id)}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: editingId === soap.id ? C.brand : '#6B7280', padding: '2px', display: 'flex' }}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>
                    {editingId === soap.id ? (
                      <textarea
                        value={soap.description}
                        onChange={e => updateDescription(soap.id, e.target.value)}
                        rows={3}
                        style={{ ...textarea, fontSize: '12px', padding: '6px 8px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>{soap.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: preview ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <BifoldPreview introText={introText} soaps={soaps} hasGenerated={hasGenerated} />
        </div>
      </div>

      {/* ── Print sheet ── */}
      <div className="hn-print-sheet" style={{ display: 'none' }}>
        <InsidePage soaps={soaps} />
        <div className="hn-fold-guide" style={{ display: 'none' }} />
        <CoverPage introText={introText} />
      </div>
    </div>
  );
}

/* ── style helpers ── */
function Label({ children }) {
  return <div style={{ fontWeight: 700, fontSize: '13px', color: '#1B4332', marginBottom: '10px', fontFamily: SANS }}>{children}</div>;
}

const card = { background: 'white', borderRadius: '12px', padding: '16px 18px', border: '1px solid #E5E7EB' };
const input = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', fontFamily: SANS, boxSizing: 'border-box', color: '#374151', outline: 'none' };
const select = { ...input, cursor: 'pointer', background: 'white' };
const textarea = { ...input, resize: 'vertical', lineHeight: 1.65 };
const btn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '13px', fontFamily: SANS, transition: 'box-shadow 0.2s' };
