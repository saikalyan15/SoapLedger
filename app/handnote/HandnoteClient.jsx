'use client';

import { useState } from 'react';
import { Plus, Trash2, Printer, RefreshCw, Loader2, FileText, Edit3, ArrowLeft, Scissors } from 'lucide-react';
import Link from 'next/link';

const C = {
  brand:      '#1B4332',
  pageBg:     '#FDF3E7',
  textBrown:  '#4A3728',
  subBrown:   '#7D5A35',
  rule:       '#C9A876',
  blobPeach:  '#EDCFAE',
  blobPeach2: '#E5C49E',
  blobSage:   '#C4D5C4',
  muted:      '#6B7280',
};

const SANS  = '"Plus Jakarta Sans", "Inter", Arial, sans-serif';
const SERIF = '"Cormorant Garamond", "Garamond", Georgia, serif';

const DEFAULT_INTRO =
  'Every bar in this pouch is handcrafted in small batches on our farm in Goa. No shortcuts, no synthetics — just honest ingredients for your skin.';

/* ── decorative blobs ── */
function Blobs({ variant = 'cover' }) {
  return (
    <>
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '48%', height: '38%',
        background: C.blobPeach, borderRadius: '50%', opacity: 0.55,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-8%', left: '-6%',
        width: '38%', height: '28%',
        background: C.blobPeach2, borderRadius: '50%', opacity: 0.45,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '0%', right: '-6%',
        width: '30%', height: '22%',
        background: C.blobSage, borderRadius: '50%', opacity: 0.55,
        pointerEvents: 'none',
      }} />
      {variant === 'cover' && (
        <div style={{
          position: 'absolute', top: '4%', right: '-4%',
          width: '20%', height: '14%',
          background: C.blobSage, borderRadius: '50%', opacity: 0.3,
          pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

/* ── thin horizontal rule ── */
function Rule({ width = '65%', mb = '0' }) {
  return (
    <div style={{
      width, height: '0.4mm', background: C.rule,
      marginBottom: mb, flexShrink: 0,
    }} />
  );
}

/* ══════════════════════════════════════
   COVER PAGE  (right panel of bifold)
══════════════════════════════════════ */
function CoverPage({ introText }) {
  return (
    <div className="hn-page">
      <Blobs variant="cover" />
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        height: '100%', padding: '7mm 7mm 5mm', boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <img
          src="/logo/healing-soil-v2.1-transparent.png"
          alt="Healing Soil"
          style={{ width: '22mm', height: 'auto', marginBottom: '2mm', flexShrink: 0 }}
        />

        {/* Brand name */}
        <div style={{
          fontFamily: SANS, fontSize: '6.5pt', fontWeight: 700,
          color: C.subBrown, letterSpacing: '0.30em', marginBottom: '1.5mm',
        }}>
          HEALING SOIL
        </div>

        <Rule mb="5mm" />

        {/* Tagline — only line using the elegant serif italic */}
        <div style={{
          fontFamily: SERIF, fontStyle: 'italic', fontSize: '19pt',
          color: C.textBrown, textAlign: 'center', lineHeight: 1.35,
          marginBottom: '5mm', flexShrink: 0,
        }}>
          a little something,<br />made with love
        </div>

        {/* Intro body — clean, readable sans */}
        <div style={{
          fontFamily: SANS, fontSize: '8pt', fontWeight: 400,
          color: C.textBrown, textAlign: 'justify', lineHeight: 1.8,
          flex: 1, overflow: 'hidden',
        }}>
          {introText}
        </div>

        {/* Footer */}
        <div style={{ width: '100%', marginTop: '3mm', flexShrink: 0 }}>
          <Rule width="100%" mb="2.5mm" />
          <div style={{
            fontFamily: SANS, fontSize: '5.5pt', fontWeight: 600,
            color: C.subBrown, letterSpacing: '0.22em', textAlign: 'center',
          }}>
            HANDMADE · SMALL BATCH · GOA
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   INSIDE PAGE  (left panel of bifold)
══════════════════════════════════════ */
function InsidePage({ soaps }) {
  return (
    <div className="hn-page">
      <Blobs variant="inside" />
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: '7mm 7mm 5mm', boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{
          fontFamily: SANS, fontSize: '6.5pt', fontWeight: 700,
          color: C.subBrown, letterSpacing: '0.25em', marginBottom: '4mm',
          flexShrink: 0,
        }}>
          WHAT'S INSIDE
        </div>

        {/* Soap list */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          gap: '3.5mm', overflow: 'hidden',
        }}>
          {soaps.length === 0 ? (
            <div style={{
              fontFamily: SANS, fontSize: '8pt', color: C.muted,
              fontStyle: 'italic', opacity: 0.6,
            }}>
              Add soaps using the form →
            </div>
          ) : soaps.map((soap, i) => (
            <div key={i}>
              <div style={{
                fontFamily: SERIF, fontSize: '11pt', fontWeight: 600,
                color: C.textBrown, lineHeight: 1.1, marginBottom: '1mm',
              }}>
                {soap.name}
              </div>
              <div style={{
                fontFamily: SANS, fontSize: '7.5pt', fontWeight: 400,
                color: C.textBrown, lineHeight: 1.7,
              }}>
                {soap.description}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, marginTop: '2mm' }}>
          <Rule width="100%" mb="2mm" />
          <div style={{
            fontFamily: SANS, fontSize: '5.5pt', color: C.subBrown,
            textAlign: 'center', lineHeight: 1.8,
          }}>
            View our catalog @ healingsoil.in/shop<br />
            or WhatsApp +91-7483100651<br />
            Follow us on @healingsoil.in on Instagram
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BIFOLD PREVIEW (screen only)
   Shows the card as it looks when open
══════════════════════════════════════ */
function BifoldPreview({ introText, soaps }) {
  return (
    <div>
      {/* Open view label */}
      <div style={{
        fontFamily: SANS, fontSize: '10px', fontWeight: 600,
        color: C.muted, letterSpacing: '0.1em', textAlign: 'center',
        marginBottom: '8px',
      }}>
        OPEN VIEW
      </div>

      {/* The open bifold — two A6 panels side by side */}
      <div style={{
        display: 'flex',
        boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
        borderRadius: '2px',
      }}>
        <InsidePage soaps={soaps} />
        {/* Spine / fold line */}
        <div style={{
          width: '2px',
          background: 'linear-gradient(to bottom, transparent, #C9A876 20%, #C9A876 80%, transparent)',
          flexShrink: 0,
          opacity: 0.6,
        }} />
        <CoverPage introText={introText} />
      </div>

      {/* Fold instruction */}
      <div style={{
        fontFamily: SANS, fontSize: '10px', color: C.muted,
        textAlign: 'center', marginTop: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <Scissors size={11} />
        Fold along the centre line · Cover faces out · Inside opens up
      </div>

      {/* Closed preview label */}
      <div style={{
        fontFamily: SANS, fontSize: '10px', fontWeight: 600,
        color: C.muted, letterSpacing: '0.1em', textAlign: 'center',
        marginTop: '20px', marginBottom: '8px',
      }}>
        FOLDED (how it looks in the pouch)
      </div>

      {/* Folded state — just the cover */}
      <div style={{
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.14)', borderRadius: '2px' }}>
          <CoverPage introText={introText} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function HandnoteClient({ products }) {
  const [soaps, setSoaps]                 = useState([]);
  const [introText, setIntroText]         = useState(DEFAULT_INTRO);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customName, setCustomName]       = useState('');
  const [notes, setNotes]                 = useState('');
  const [generating, setGenerating]       = useState(false);
  const [editingId, setEditingId]         = useState(null);

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
  const soapName        = selectedProduct?.name || customName.trim();

  const canAdd = !generating && soapName.length > 0;

  async function handleGenerate() {
    if (!canAdd) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/handnote/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        soapName,
          baseType:    selectedProduct?.base_type    || '',
          ingredients: selectedProduct?.ingredients  || '',
          notes,
        }),
      });
      const data = await res.json();
      if (data.description) {
        setSoaps(prev => [...prev, { id: Date.now(), name: soapName, description: data.description }]);
        setSelectedProductId('');
        setCustomName('');
        setNotes('');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate(soapId) {
    const soap = soaps.find(s => s.id === soapId);
    if (!soap) return;
    setSoaps(prev => prev.map(s => s.id === soapId ? { ...s, regenerating: true } : s));
    try {
      const res = await fetch('/api/handnote/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: soap.name, baseType: '', ingredients: '', notes: '' }),
      });
      const data = await res.json();
      if (data.description) {
        setSoaps(prev => prev.map(s => s.id === soapId ? { ...s, description: data.description, regenerating: false } : s));
      }
    } catch {
      setSoaps(prev => prev.map(s => s.id === soapId ? { ...s, regenerating: false } : s));
    }
  }

  function removeSoap(id) {
    setSoaps(prev => prev.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function updateDescription(id, description) {
    setSoaps(prev => prev.map(s => s.id === id ? { ...s, description } : s));
  }

  return (
    <div className="hn-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        /* ── Print: A5 landscape, zero margins ── */
        @page { size: 210mm 148mm; margin: 0; }

        .hn-root {
          background: #F0EDE8;
          min-height: 100vh;
          padding: 20px;
          font-family: ${SANS};
        }

        /* A6 card — 105 × 148 mm */
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Print styles ── */
        @media print {
          .no-print { display: none !important; }

          .hn-root {
            background: white !important;
            padding: 0 !important;
            min-height: 0 !important;
          }

          /* The print sheet: A5 landscape = two A6 panels side by side */
          .hn-print-sheet {
            display: flex !important;
            flex-direction: row !important;
            width: 210mm !important;
            height: 148mm !important;
          }

          /* Centre fold guide — prints as a faint dashed line */
          .hn-fold-guide {
            display: block !important;
            width: 0 !important;
            border-left: 0.3mm dashed rgba(180,150,100,0.4) !important;
            height: 148mm !important;
            flex-shrink: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="no-print" style={{
        background: C.brand, color: 'white', padding: '14px 20px',
        borderRadius: '12px', maxWidth: '1000px', margin: '0 auto 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/labels" style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
          <FileText size={18} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>Gift Handnote</div>
            <div style={{ fontSize: '11px', opacity: 0.65 }}>
              {soaps.length === 0
                ? 'Add soaps to get started'
                : `${soaps.length} soap${soaps.length !== 1 ? 's' : ''} · bifold A5 card`}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          disabled={soaps.length === 0}
          style={{
            background: soaps.length === 0 ? 'rgba(255,255,255,0.25)' : 'white',
            color: C.brand, border: 'none', padding: '9px 18px',
            borderRadius: '8px', fontWeight: 800, fontSize: '13px',
            cursor: soaps.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}
        >
          <Printer size={15} /> Print Handnote
        </button>
      </div>

      {/* ── Screen layout: config left + preview right ── */}
      <div className="no-print" style={{
        maxWidth: '1000px', margin: '0 auto',
        display: 'flex', gap: '24px', alignItems: 'flex-start',
      }}>

        {/* Config panel */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Cover message */}
          <div style={cardStyle}>
            <SectionLabel>Cover Message</SectionLabel>
            <textarea
              value={introText}
              onChange={e => setIntroText(e.target.value)}
              rows={4}
              style={textareaStyle}
            />
          </div>

          {/* Add soap */}
          <div style={cardStyle}>
            <SectionLabel>Add a Soap</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>

              <div>
                <FieldLabel>From your products</FieldLabel>
                <select
                  value={selectedProductId}
                  onChange={e => { setSelectedProductId(e.target.value); setCustomName(''); }}
                  style={selectStyle}
                >
                  <option value="">— Pick a product —</option>
                  {products.map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({p.base_type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                — or —
              </div>

              <div>
                <FieldLabel>Custom soap name</FieldLabel>
                <input
                  type="text"
                  value={customName}
                  onChange={e => { setCustomName(e.target.value); setSelectedProductId(''); }}
                  placeholder="e.g. Lavender Dream"
                  style={inputStyle}
                />
              </div>

              <div>
                <FieldLabel>Hint for AI <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></FieldLabel>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. highlight the calming scent"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!canAdd}
                style={{
                  background: canAdd ? C.brand : '#9CA3AF',
                  color: 'white', border: 'none', padding: '10px 14px',
                  borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                  cursor: canAdd ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  fontFamily: SANS,
                }}
              >
                {generating
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                  : <><Plus size={14} /> Add &amp; Generate</>}
              </button>
            </div>
          </div>

          {/* Soap list */}
          {soaps.length > 0 && (
            <div style={cardStyle}>
              <SectionLabel>Soaps on this note ({soaps.length})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {soaps.map(soap => (
                  <div key={soap.id} style={{
                    background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>{soap.name}</div>
                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <IconBtn
                          onClick={() => handleRegenerate(soap.id)}
                          title="Regenerate"
                          style={{ color: soap.regenerating ? C.brand : '#6B7280' }}
                        >
                          <RefreshCw size={12} style={soap.regenerating ? { animation: 'spin 1s linear infinite' } : {}} />
                        </IconBtn>
                        <IconBtn
                          onClick={() => setEditingId(editingId === soap.id ? null : soap.id)}
                          title="Edit"
                          style={{ color: editingId === soap.id ? C.brand : '#6B7280' }}
                        >
                          <Edit3 size={12} />
                        </IconBtn>
                        <IconBtn onClick={() => removeSoap(soap.id)} style={{ color: '#EF4444' }}>
                          <Trash2 size={12} />
                        </IconBtn>
                      </div>
                    </div>
                    {editingId === soap.id ? (
                      <textarea
                        value={soap.description}
                        onChange={e => updateDescription(soap.id, e.target.value)}
                        rows={3}
                        style={{ ...textareaStyle, fontSize: '12px', padding: '6px 8px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.55 }}>
                        {soap.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <BifoldPreview introText={introText} soaps={soaps} />
        </div>
      </div>

      {/* ── Print output: A5 landscape bifold sheet ── */}
      <div className="hn-print-sheet" style={{ display: 'none' }}>
        {/* Left panel = Inside (what you see when you open the card) */}
        <InsidePage soaps={soaps} />
        {/* Hairline fold guide */}
        <div className="hn-fold-guide" style={{ display: 'none' }} />
        {/* Right panel = Cover (what faces out) */}
        <CoverPage introText={introText} />
      </div>
    </div>
  );
}

/* ── small style helpers ── */
function SectionLabel({ children }) {
  return (
    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1B4332', marginBottom: '10px' }}>
      {children}
    </div>
  );
}
function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px', fontFamily: SANS }}>
      {children}
    </label>
  );
}
function IconBtn({ children, onClick, title, style = {} }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '3px', display: 'flex', alignItems: 'center',
      ...style,
    }}>
      {children}
    </button>
  );
}

const cardStyle = {
  background: 'white', borderRadius: '12px',
  padding: '16px 18px', border: '1px solid #E5E7EB',
};
const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: '8px',
  border: '1px solid #D1D5DB', fontSize: '13px',
  fontFamily: SANS, boxSizing: 'border-box', color: '#374151',
};
const selectStyle = {
  ...inputStyle, cursor: 'pointer', background: 'white',
};
const textareaStyle = {
  width: '100%', padding: '9px 10px', borderRadius: '8px',
  border: '1px solid #D1D5DB', fontSize: '13px', fontFamily: SANS,
  resize: 'vertical', lineHeight: 1.65, boxSizing: 'border-box',
  color: '#374151',
};
