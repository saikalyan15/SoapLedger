'use client';

import { useState } from 'react';
import { Plus, Trash2, Printer, RefreshCw, Loader2, Sparkles, Edit3, ArrowLeft, Scissors, X } from 'lucide-react';
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
  'Every bar in this pouch is handcrafted in small batches on our farm in Goa. No shortcuts, no synthetics, just honest ingredients for your skin.';

/* ── decorative blobs ── */
function Blobs({ variant = 'cover' }) {
  return (
    <>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '48%', height: '38%', background: C.blobPeach, borderRadius: '50%', opacity: 0.55, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-8%', left: '-6%', width: '38%', height: '28%', background: C.blobPeach2, borderRadius: '50%', opacity: 0.45, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0%', right: '-6%', width: '30%', height: '22%', background: C.blobSage, borderRadius: '50%', opacity: 0.55, pointerEvents: 'none' }} />
      {variant === 'cover' && (
        <div style={{ position: 'absolute', top: '4%', right: '-4%', width: '20%', height: '14%', background: C.blobSage, borderRadius: '50%', opacity: 0.3, pointerEvents: 'none' }} />
      )}
    </>
  );
}

function Rule({ width = '65%', mb = '0' }) {
  return <div style={{ width, height: '0.4mm', background: C.rule, marginBottom: mb, flexShrink: 0 }} />;
}

/* ══════════════════════════════════════
   COVER PAGE
══════════════════════════════════════ */
function CoverPage({ introText }) {
  return (
    <div className="hn-page">
      <Blobs variant="cover" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '7mm 7mm 5mm', boxSizing: 'border-box' }}>
        <img src="/logo/healing-soil-v2.1-transparent.png" alt="Healing Soil" style={{ width: '22mm', height: 'auto', marginBottom: '2mm', flexShrink: 0 }} />

        <div style={{ fontFamily: SANS, fontSize: '6.5pt', fontWeight: 700, color: C.subBrown, letterSpacing: '0.30em', marginBottom: '1.5mm' }}>
          HEALING SOIL
        </div>

        <Rule mb="5mm" />

        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '19pt', color: C.textBrown, textAlign: 'center', lineHeight: 1.35, marginBottom: '5mm', flexShrink: 0 }}>
          a little something,<br />made with love
        </div>

        <div style={{ fontFamily: SANS, fontSize: '8pt', fontWeight: 400, color: C.textBrown, textAlign: 'justify', lineHeight: 1.8, flex: 1, overflow: 'hidden' }}>
          {introText}
        </div>

        <div style={{ width: '100%', marginTop: '3mm', flexShrink: 0 }}>
          <Rule width="100%" mb="2.5mm" />
          <div style={{ fontFamily: SANS, fontSize: '5.5pt', fontWeight: 600, color: C.subBrown, letterSpacing: '0.22em', textAlign: 'center' }}>
            HANDMADE · SMALL BATCH · GOA
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   INSIDE PAGE
══════════════════════════════════════ */
function InsidePage({ soaps }) {
  return (
    <div className="hn-page">
      <Blobs variant="inside" />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '7mm 7mm 5mm', boxSizing: 'border-box' }}>
        <div style={{ fontFamily: SANS, fontSize: '6.5pt', fontWeight: 700, color: C.subBrown, letterSpacing: '0.25em', marginBottom: '4mm', flexShrink: 0 }}>
          WHAT'S INSIDE
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3.5mm', overflow: 'hidden' }}>
          {soaps.map((soap, i) => (
            <div key={i}>
              <div style={{ fontFamily: SERIF, fontSize: '11pt', fontWeight: 600, color: C.textBrown, lineHeight: 1.1, marginBottom: '1mm' }}>
                {soap.name}
              </div>
              <div style={{ fontFamily: SANS, fontSize: '7.5pt', fontWeight: 400, color: C.textBrown, lineHeight: 1.7 }}>
                {soap.description || ''}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flexShrink: 0, marginTop: '2mm' }}>
          <Rule width="100%" mb="2mm" />
          <div style={{ fontFamily: SANS, fontSize: '5.5pt', color: C.subBrown, textAlign: 'center', lineHeight: 1.8 }}>
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
   BIFOLD PREVIEW (screen)
══════════════════════════════════════ */
function BifoldPreview({ introText, soaps, hasGenerated }) {
  if (!hasGenerated) {
    return (
      <div style={{
        width: '210mm', display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '148mm', background: 'rgba(255,255,255,0.5)',
        borderRadius: '4px', border: '1.5px dashed #D1D5DB',
        flexDirection: 'column', gap: '10px',
      }}>
        <Sparkles size={28} color="#C9A876" />
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

      <div style={{ display: 'flex', boxShadow: '0 4px 24px rgba(0,0,0,0.14)', borderRadius: '2px' }}>
        <InsidePage soaps={soaps} />
        <div style={{ width: '2px', background: 'linear-gradient(to bottom, transparent, #C9A876 20%, #C9A876 80%, transparent)', flexShrink: 0, opacity: 0.5 }} />
        <CoverPage introText={introText} />
      </div>

      <div style={{ fontFamily: SANS, fontSize: '10px', color: C.muted, textAlign: 'center', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <Scissors size={11} /> Print on A5 (or half an A4). Fold in half. Drop in the pouch.
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

  /* Generate descriptions for all soaps at once */
  async function generateAll() {
    if (soaps.length === 0 || generating) return;
    setGenerating(true);
    try {
      const results = await Promise.all(
        soaps.map(soap =>
          fetch('/api/handnote/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name:        soap.name,
              baseType:    soap.baseType,
              ingredients: soap.ingredients,
              notes:       '',
            }),
          }).then(r => r.json())
        )
      );
      setSoaps(prev => prev.map((soap, i) => ({
        ...soap,
        description: results[i]?.description || soap.description,
      })));
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
              rows={4}
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
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
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
