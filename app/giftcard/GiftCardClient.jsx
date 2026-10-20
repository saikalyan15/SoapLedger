'use client';

import { useState } from 'react';
import { Printer, ArrowLeft, Save, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { updateSettingAction } from '@/lib/actions/settings';

const C = {
  brand:     '#1B4332',
  pageBg:    '#FDF3E7',
  textBrown: '#4A3728',
  rule:      '#C9A876',
  muted:     '#6B7280',
};

const SANS  = '"Plus Jakarta Sans", "Inter", Arial, sans-serif';
const SERIF = '"Cormorant Garamond", "Garamond", Georgia, serif';

/* Screen-only paper swatches, so the preview looks like the stock you'll print on */
const PAPERS = {
  cream: { label: 'Cream card', color: C.pageBg },
  kraft: { label: 'Kraft card', color: '#CDAE84' },
  white: { label: 'White card', color: '#FFFFFF' },
};

/* Seed copy, used only when the settings key has never been saved */
const SEED = {
  giftcard_tagline: 'from the soil,\nfor your skin',
  giftcard_body:    'Handmade in small batches on our farm in Goa, with oils, clays and herbs we grow or source with care. No synthetics, no shortcuts. Just honest soap, made slowly.',
  giftcard_footer:  'HANDMADE · SMALL BATCH · GOA',
  giftcard_contact: 'healingsoil.in · @healingsoil.in',
  giftcard_qr_url:  'https://healingsoil.in/shop',
};

/* Geometry (mm). Folded card is 70×100; opened flat it's back|front = 140×100.
   Open cards sit sideways on the sheet in 100×140 slots: 2 × 2 = 4 per A4 */
const CARD_W = 70;
const CARD_H = 100;
const OPEN_W = CARD_W * 2;
const COLS = 2;
const ROWS = 2;
const PER_SHEET = COLS * ROWS;
const GRID_X = (210 - COLS * CARD_H) / 2;   // 5mm
const GRID_Y = (297 - ROWS * OPEN_W) / 2;   // 8.5mm

/* ══════════════════════════════════════
   SOIL LAYERS — thin strata lines, the card's one motif
══════════════════════════════════════ */
function SoilLayers({ height = '7mm', faint = false }) {
  const o = faint ? 0.55 : 1;
  return (
    <svg viewBox="0 0 200 22" preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <path d="M0 4 Q25 1 50 4 T100 4 T150 4 T200 4" fill="none" stroke={C.rule} strokeWidth="0.9" opacity={o} />
      <path d="M0 9 Q30 12 60 9 T120 9 T180 9 T200 9" fill="none" stroke={C.textBrown} strokeWidth="0.6" opacity={0.7 * o} />
      <path d="M0 14 Q20 12 45 14 T95 14 T145 14 T200 14" fill="none" stroke={C.rule} strokeWidth="0.6" opacity={0.8 * o} />
      <path d="M0 19 Q35 21 70 19 T140 19 T200 19" fill="none" stroke={C.brand} strokeWidth="0.5" opacity={0.6 * o} />
      {!faint && [[18, 11.5], [57, 16.5], [88, 11.8], [131, 16.8], [166, 11.6], [190, 16.4]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.9" fill={C.textBrown} opacity="0.45" />
      ))}
    </svg>
  );
}

/* Logo PNG has wide transparent margins — pull them in with negative margins
   (nothing is clipped). maxWidth 'none' overrides Tailwind's img { max-width: 100% } */
function Logo({ width = 30 }) {
  const imgW = width / 0.6;            // artwork ≈ 52% of the PNG's width; 60% leaves slack
  const imgH = imgW * (1536 / 2814);
  return (
    <img
      src="/logo/healing-soil-v2.1-transparent.png"
      alt="Healing Soil"
      style={{
        display: 'block', flexShrink: 0, maxWidth: 'none',
        width: `${imgW}mm`, height: `${imgH}mm`,
        margin: `${-imgH * 0.07}mm ${-imgW * 0.2}mm 0`,
      }}
    />
  );
}

const cardShell = (bg) => ({
  width: `${CARD_W}mm`, height: `${CARD_H}mm`,
  background: bg, boxSizing: 'border-box', padding: '6mm',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  overflow: 'hidden', position: 'relative',
  WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
});

/* ══════════════════════════════════════
   FRONT
══════════════════════════════════════ */
function CardFront({ copy, bg }) {
  return (
    <div style={cardShell(bg)}>
      <div style={{ height: '5mm', flexShrink: 0 }} />
      <Logo width={34} />
      <div style={{ width: '14mm', height: '0.3mm', background: C.rule, margin: '6mm 0 5mm', flexShrink: 0 }} />
      <div style={{
        fontFamily: SERIF, fontStyle: 'italic', fontSize: '16pt', lineHeight: 1.25,
        color: C.textBrown, textAlign: 'center', whiteSpace: 'pre-line',
      }}>
        {copy.giftcard_tagline}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ width: '100%', marginBottom: '2.5mm' }}>
        <SoilLayers />
      </div>
      <div style={{ fontFamily: SANS, fontSize: '5pt', fontWeight: 600, letterSpacing: '0.25em', color: C.brand, textAlign: 'center' }}>
        {copy.giftcard_footer}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BACK
══════════════════════════════════════ */
function CardBack({ copy, fromName, bg }) {
  const name = fromName.trim();
  return (
    <div style={cardShell(bg)}>
      <div style={{ height: '4mm', flexShrink: 0 }} />
      <div style={{
        fontFamily: SANS, fontSize: '7.5pt', lineHeight: 1.75,
        color: C.textBrown, textAlign: 'center', whiteSpace: 'pre-line',
      }}>
        {copy.giftcard_body}
      </div>

      <div style={{ width: '14mm', height: '0.3mm', background: C.rule, margin: '5mm 0', flexShrink: 0 }} />

      {name ? (
        <div style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: C.textBrown }}>
          <div style={{ fontSize: '10pt', lineHeight: 1.2 }}>A little gift from</div>
          <div style={{ fontSize: '14pt', fontWeight: 600, color: C.brand, lineHeight: 1.3 }}>{name}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2mm', fontFamily: SERIF, fontStyle: 'italic', fontSize: '11pt', color: C.textBrown }}>
          From
          <div style={{ width: '36mm', borderBottom: `0.3mm dotted ${C.textBrown}`, marginBottom: '1mm' }} />
        </div>
      )}

      <div style={{ flex: 1 }} />

      {copy.giftcard_qr_url && (
        <QRCodeSVG
          value={copy.giftcard_qr_url}
          size={256}
          level="M"
          marginSize={0}
          fgColor={C.brand}
          bgColor="transparent"
          style={{ width: '16mm', height: '16mm', flexShrink: 0 }}
        />
      )}
      <div style={{ fontFamily: SANS, fontSize: '5.5pt', fontWeight: 600, letterSpacing: '0.12em', color: C.brand, textAlign: 'center', margin: '2.5mm 0' }}>
        {copy.giftcard_contact}
      </div>
      <div style={{ width: '100%' }}>
        <SoilLayers height="3.5mm" faint />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PRINT SHEET — single-sided. Each open card (back | front) is
   rotated into a 100×140 slot; fold across the middle, print side out.
══════════════════════════════════════ */
/* Lines run right across the grid — printers can't reach the outer ~5mm,
   so marks only in the margin get lost. Cut = dashed, fold = dotted. */
function CutFoldLines({ count }) {
  const xs = Array.from({ length: COLS + 1 }, (_, i) => GRID_X + i * CARD_H);
  const ys = Array.from({ length: ROWS + 1 }, (_, i) => GRID_Y + i * OPEN_W);
  const usedRows = Math.ceil(count / COLS);
  const cut  = { stroke: '#A8A29E', strokeWidth: 0.25, strokeDasharray: '2 1.2' };
  const fold = { stroke: '#C9A876', strokeWidth: 0.3, strokeDasharray: '0.4 1', strokeLinecap: 'round' };
  return (
    <svg viewBox="0 0 210 297" style={{ position: 'absolute', inset: 0, width: '210mm', height: '297mm', display: 'block', maxWidth: 'none' }}>
      {xs.map(x => <line key={`x${x}`} x1={x} x2={x} y1={GRID_Y} y2={297 - GRID_Y} {...cut} />)}
      {ys.map(y => <line key={`y${y}`} y1={y} y2={y} x1={GRID_X} x2={210 - GRID_X} {...cut} />)}
      {Array.from({ length: usedRows }, (_, r) => {
        const y = GRID_Y + r * OPEN_W + CARD_W;
        return <line key={`f${r}`} y1={y} y2={y} x1={GRID_X} x2={210 - GRID_X} {...fold} />;
      })}
    </svg>
  );
}

function PrintSheet({ count, children }) {
  return (
    <div className="gc-sheet">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', overflow: 'hidden',
          left: `${GRID_X + (i % COLS) * CARD_H}mm`, top: `${GRID_Y + Math.floor(i / COLS) * OPEN_W}mm`,
          width: `${CARD_H}mm`, height: `${OPEN_W}mm`,
        }}>
          <div style={{
            position: 'absolute', display: 'flex',
            width: `${OPEN_W}mm`, height: `${CARD_H}mm`,
            left: `${(CARD_H - OPEN_W) / 2}mm`, top: `${(OPEN_W - CARD_H) / 2}mm`,
            transform: 'rotate(90deg)',
          }}>
            {children}
          </div>
        </div>
      ))}
      <CutFoldLines count={count} />
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function GiftCardClient({ savedSettings }) {
  const [copy, setCopy]           = useState({ ...SEED, ...savedSettings });
  const [fromName, setFromName]   = useState('');
  const [cardCount, setCardCount] = useState(8);
  const [paper, setPaper]         = useState('cream');
  const [printFill, setPrintFill] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error

  const count      = Math.max(1, Math.min(400, Number(cardCount) || 1));
  const sheetCount = Math.ceil(count / PER_SHEET);
  const sheets     = Array.from({ length: sheetCount }, (_, i) => Math.min(PER_SHEET, count - i * PER_SHEET));

  const previewBg = PAPERS[paper].color;
  const printBg   = printFill ? C.pageBg : 'transparent';

  function setField(key, value) {
    setCopy(prev => ({ ...prev, [key]: value }));
    setSaveState('idle');
  }

  async function saveDefaults() {
    setSaveState('saving');
    try {
      for (const key of Object.keys(SEED)) {
        await updateSettingAction(key, copy[key] ?? '');
      }
      setSaveState('saved');
    } catch (err) {
      console.error('Gift card save error:', err);
      setSaveState('error');
    }
  }

  return (
    <div className="gc-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        @page { size: 210mm 297mm; margin: 0; }

        .gc-root {
          background: #F0EDE8;
          min-height: 100vh;
          padding: 20px;
          font-family: ${SANS};
        }

        .gc-sheet { display: none; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media print {
          .no-print { display: none !important; }
          .gc-root  { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .gc-sheet {
            display: block !important;
            position: relative;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
          }
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
            <div style={{ fontSize: '16px', fontWeight: 800 }}>Gift Card</div>
            <div style={{ fontSize: '11px', opacity: 0.6 }}>
              {count} card{count !== 1 ? 's' : ''} · {sheetCount} A4 sheet{sheetCount !== 1 ? 's' : ''}, single-sided, cut & fold
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: 'white', color: C.brand, border: 'none', padding: '9px 18px',
            borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px', fontFamily: SANS,
          }}
        >
          <Printer size={15} /> Print
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="no-print" style={{
        maxWidth: '1040px', margin: '0 auto',
        display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap',
      }}>

        {/* ── Left: config ── */}
        <div style={{ flex: '0 0 310px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* This batch */}
          <div style={card}>
            <Label>This batch</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Gift from (person or company)">
                <input
                  type="text"
                  value={fromName}
                  placeholder="Leave empty for a handwritten line"
                  onChange={e => setFromName(e.target.value)}
                  maxLength={40}
                  style={input}
                />
              </Field>
              <Field label={`Number of cards (${PER_SHEET} per A4)`}>
                <input
                  type="number"
                  min={1}
                  max={400}
                  value={cardCount}
                  onChange={e => setCardCount(e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Preview on">
                <select value={paper} onChange={e => setPaper(e.target.value)} style={select}>
                  {Object.entries(PAPERS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={printFill} onChange={e => setPrintFill(e.target.checked)} />
                Print a cream background (only for white paper)
              </label>
            </div>
          </div>

          {/* Card wording */}
          <div style={card}>
            <Label>Card wording</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Field label="Front tagline">
                <textarea value={copy.giftcard_tagline} onChange={e => setField('giftcard_tagline', e.target.value)} rows={2} maxLength={500} style={textarea} />
              </Field>
              <Field label="Front footer">
                <input type="text" value={copy.giftcard_footer} onChange={e => setField('giftcard_footer', e.target.value)} maxLength={500} style={input} />
              </Field>
              <Field label="Back message">
                <textarea value={copy.giftcard_body} onChange={e => setField('giftcard_body', e.target.value)} rows={5} maxLength={500} style={textarea} />
              </Field>
              <Field label="QR code link">
                <input type="url" value={copy.giftcard_qr_url} onChange={e => setField('giftcard_qr_url', e.target.value)} maxLength={500} style={input} />
              </Field>
              <Field label="Contact line">
                <input type="text" value={copy.giftcard_contact} onChange={e => setField('giftcard_contact', e.target.value)} maxLength={500} style={input} />
              </Field>
              <button
                onClick={saveDefaults}
                disabled={saveState === 'saving'}
                style={{ ...btn, background: C.brand, cursor: saveState === 'saving' ? 'wait' : 'pointer' }}
              >
                {saveState === 'saving' && <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>}
                {saveState === 'saved'  && <><Check size={14} /> Saved as default</>}
                {saveState === 'idle'   && <><Save size={14} /> Save wording as default</>}
                {saveState === 'error'  && <><Save size={14} /> Save failed, try again</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: preview ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: '10px', fontWeight: 600, color: C.muted, letterSpacing: '0.1em', marginBottom: '10px' }}>
            PREVIEW · 1.5× ACTUAL SIZE (card is 70 × 100 mm)
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', zoom: 1.5 }}>
            <div>
              <div style={previewTag}>FRONT</div>
              <div style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.14)' }}>
                <CardFront copy={copy} bg={previewBg} />
              </div>
            </div>
            <div>
              <div style={previewTag}>BACK</div>
              <div style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.14)' }}>
                <CardBack copy={copy} fromName={fromName} bg={previewBg} />
              </div>
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: '11px', color: C.muted, marginTop: '16px', lineHeight: 1.7 }}>
            Print <b>single-sided</b> on 200–250gsm card at 100% scale (turn off &ldquo;fit to page&rdquo;).<br />
            Cut on the grey dashed lines, then fold on the gold dotted line with the print facing out
            (score it first for a crisp fold). Each sheet gives {PER_SHEET} cards; the inside stays blank for a note.
          </div>
        </div>
      </div>

      {/* ── Print output: open cards (back | front), 4 per A4 ── */}
      {sheets.map((n, i) => (
        <PrintSheet key={i} count={n}>
          <CardBack copy={copy} fromName={fromName} bg={printBg} />
          <CardFront copy={copy} bg={printBg} />
        </PrintSheet>
      ))}
    </div>
  );
}

/* ── style helpers ── */
function Label({ children }) {
  return <div style={{ fontWeight: 700, fontSize: '13px', color: '#1B4332', marginBottom: '10px', fontFamily: SANS }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: C.muted, marginBottom: '4px', fontFamily: SANS }}>{label}</div>
      {children}
    </div>
  );
}

const card = { background: 'white', borderRadius: '12px', padding: '16px 18px', border: '1px solid #E5E7EB' };
const input = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', fontFamily: SANS, boxSizing: 'border-box', color: '#374151', outline: 'none' };
const select = { ...input, cursor: 'pointer', background: 'white' };
const textarea = { ...input, resize: 'vertical', lineHeight: 1.65 };
const btn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '10px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '13px', fontFamily: SANS, transition: 'box-shadow 0.2s' };
const previewTag = { fontFamily: SANS, fontSize: '7px', fontWeight: 700, color: C.muted, letterSpacing: '0.12em', marginBottom: '4px' };
