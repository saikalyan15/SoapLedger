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
  giftcard_personal_heading: 'a little note for you',
  giftcard_personal_signoff: 'with love,',
};

/* Geometry (mm). Folded card is 66×70 (fits the small jute pouch). Opened flat
   it's 66×140: back on top (upside down), front below, fold across the middle —
   a tent fold, so the fold sits at the card's top. 3 × 2 = 6 per A4, no rotation */
const CARD_W = 66;
const CARD_H = 70;
const OPEN_H = CARD_H * 2;
const COLS = 3;
const ROWS = 2;
const PER_SHEET = COLS * ROWS;
const SHEET_W = COLS * CARD_W;   // 198mm
const SHEET_H = ROWS * OPEN_H;   // 280mm — page margins (@page) centre it on A4
const PAGE_MARGIN_X = (210 - SHEET_W) / 2;
const PAGE_MARGIN_Y = (297 - SHEET_H) / 2;

/* ══════════════════════════════════════
   SOIL LAYERS — thin strata lines, the card's one motif
══════════════════════════════════════ */
function SoilLayers({ height = '4.5mm', faint = false }) {
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
  background: bg, boxSizing: 'border-box', padding: '4mm',
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
      <div style={{ height: '1mm', flexShrink: 0 }} />
      <Logo width={22} />
      <div style={{ width: '11mm', height: '0.25mm', background: C.rule, margin: '3mm 0 2.5mm', flexShrink: 0 }} />
      <div style={{
        fontFamily: SERIF, fontStyle: 'italic', fontSize: '12pt', lineHeight: 1.2,
        color: C.textBrown, textAlign: 'center', whiteSpace: 'pre-line',
      }}>
        {copy.giftcard_tagline}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ width: '100%', marginBottom: '1.5mm' }}>
        <SoilLayers />
      </div>
      <div style={{ fontFamily: SANS, fontSize: '4.5pt', fontWeight: 600, letterSpacing: '0.22em', color: C.brand, textAlign: 'center' }}>
        {copy.giftcard_footer}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BACK
══════════════════════════════════════ */
/* Corporate: To line to handwrite; From is the typed company, or a line to handwrite */
function CorporateLines({ name }) {
  return (
    <>
      <WriteLine label="To" />
      {name ? (
        <div style={{ textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', color: C.textBrown, marginTop: '2mm' }}>
          <div style={{ fontSize: '8pt', lineHeight: 1.2 }}>A little gift from</div>
          <div style={{ fontSize: '11pt', fontWeight: 600, color: C.brand, lineHeight: 1.3 }}>{name}</div>
        </div>
      ) : (
        <div style={{ marginTop: '3.5mm' }}><WriteLine label="From" /></div>
      )}
    </>
  );
}

/* Personal: a heading, two lines for a short handwritten note, and a sign-off */
function PersonalNote({ name, copy }) {
  const dotted = `0.3mm dotted ${C.textBrown}`;
  return (
    <div style={{ width: '42mm', marginBottom: '1.5mm', fontFamily: SERIF, fontStyle: 'italic', color: C.textBrown }}>
      <div style={{ fontSize: '9.5pt', textAlign: 'center', lineHeight: 1.2 }}>{copy.giftcard_personal_heading}</div>
      {[0, 1].map(i => <div key={i} style={{ height: '4.8mm', borderBottom: dotted }} />)}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '1.5mm', marginTop: '2mm', fontSize: '9pt' }}>
        {copy.giftcard_personal_signoff}
        {name
          ? <span style={{ fontSize: '10.5pt', fontWeight: 600, color: C.brand, lineHeight: 1 }}>{name}</span>
          : <div style={{ width: '16mm', borderBottom: dotted, marginBottom: '1mm' }} />}
      </div>
    </div>
  );
}

/* Label + dotted line to fill in by hand; fixed label width keeps To/From lines aligned */
function WriteLine({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', fontFamily: SERIF, fontStyle: 'italic', fontSize: '9pt', color: C.textBrown }}>
      <div style={{ width: '9mm' }}>{label}</div>
      <div style={{ width: '30mm', borderBottom: `0.3mm dotted ${C.textBrown}`, marginBottom: '1mm' }} />
    </div>
  );
}

function CardBack({ copy, fromName, mode, bg }) {
  const name = fromName.trim();
  return (
    <div style={cardShell(bg)}>
      <div style={{
        fontFamily: SANS, fontSize: '6.3pt', lineHeight: 1.55,
        color: C.textBrown, textAlign: 'center', whiteSpace: 'pre-line', textWrap: 'balance',
      }}>
        {copy.giftcard_body}
      </div>

      <div style={{ width: '11mm', height: '0.25mm', background: C.rule, margin: '2mm 0', flexShrink: 0 }} />

      {mode === 'corporate'
        ? <CorporateLines name={name} />
        : <PersonalNote name={name} copy={copy} />}

      <div style={{ flex: 1 }} />

      {copy.giftcard_qr_url && (
        <QRCodeSVG
          value={copy.giftcard_qr_url}
          size={256}
          level="M"
          marginSize={0}
          fgColor={C.brand}
          bgColor="transparent"
          style={{ width: '12mm', height: '12mm', flexShrink: 0 }}
        />
      )}
      <div style={{ fontFamily: SANS, fontSize: '5pt', fontWeight: 600, letterSpacing: '0.1em', color: C.brand, textAlign: 'center', margin: '1.5mm 0' }}>
        {copy.giftcard_contact}
      </div>
      <div style={{ width: '100%' }}>
        <SoilLayers height="2.5mm" faint />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PRINT SHEET — single-sided. Each open card is back (upside down) over
   front; fold across the middle, print side out, and the back reads the
   right way up when the card is turned around.
══════════════════════════════════════ */
/* Lines run right across the grid — printers can't reach the outer ~5mm,
   so marks only in the margin get lost. Cut = dashed, fold = dotted. */
function CutFoldLines({ count }) {
  const xs = Array.from({ length: COLS + 1 }, (_, i) => i * CARD_W);
  const ys = Array.from({ length: ROWS + 1 }, (_, i) => i * OPEN_H);
  const usedRows = Math.ceil(count / COLS);
  const cut  = { stroke: '#A8A29E', strokeWidth: 0.25, strokeDasharray: '2 1.2' };
  const fold = { stroke: '#C9A876', strokeWidth: 0.3, strokeDasharray: '0.4 1', strokeLinecap: 'round' };
  return (
    <svg viewBox={`0 0 ${SHEET_W} ${SHEET_H}`} style={{ position: 'absolute', inset: 0, width: `${SHEET_W}mm`, height: `${SHEET_H}mm`, display: 'block', maxWidth: 'none', overflow: 'visible' }}>
      {xs.map(x => <line key={`x${x}`} x1={x} x2={x} y1={0} y2={SHEET_H} {...cut} />)}
      {ys.map(y => <line key={`y${y}`} y1={y} y2={y} x1={0} x2={SHEET_W} {...cut} />)}
      {Array.from({ length: usedRows }, (_, r) => {
        const y = r * OPEN_H + CARD_H;
        return <line key={`f${r}`} y1={y} y2={y} x1={0} x2={SHEET_W} {...fold} />;
      })}
    </svg>
  );
}

function PrintSheet({ count, front, back }) {
  return (
    <div className="gc-sheet">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', overflow: 'hidden',
          left: `${(i % COLS) * CARD_W}mm`, top: `${Math.floor(i / COLS) * OPEN_H}mm`,
          width: `${CARD_W}mm`, height: `${OPEN_H}mm`,
        }}>
          <div style={{ transform: 'rotate(180deg)' }}>{back}</div>
          {front}
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
  const [mode, setMode]           = useState('personal'); // personal | corporate
  const [fromName, setFromName]   = useState('');
  const [cardCount, setCardCount] = useState(PER_SHEET);
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

        /* Sheet is centred on A4 by these margins — leaves slack so rounding or a
           printer's own margin can't push a sheet onto the next page */
        @page { size: 210mm 297mm; margin: ${PAGE_MARGIN_Y}mm ${PAGE_MARGIN_X}mm; }

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
          html, body, main.main-content, main.main-content > div, .gc-root {
            margin: 0 !important; padding: 0 !important;
            min-height: 0 !important; height: auto !important;
            background: white !important;
          }
          body > div { min-height: 0 !important; }
          .gc-sheet {
            display: block !important;
            position: relative;
            width: ${SHEET_W}mm;
            height: ${SHEET_H}mm;
            overflow: hidden;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Break between sheets only — never before the first or after the last */
          .gc-sheet + .gc-sheet { break-before: page; page-break-before: always; }
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
          <Printer size={15} /> Print {sheetCount} sheet{sheetCount !== 1 ? 's' : ''}
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
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '3px' }}>
                {[['personal', 'Personal'], ['corporate', 'Corporate']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    style={{
                      flex: 1, padding: '7px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                      fontFamily: SANS, fontSize: '12px', fontWeight: 700,
                      background: mode === key ? 'white' : 'transparent',
                      color: mode === key ? C.brand : C.muted,
                      boxShadow: mode === key ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Field label={mode === 'corporate' ? 'Gift from (company or sender)' : 'Sign off as'}>
                <input
                  type="text"
                  value={fromName}
                  placeholder={mode === 'corporate' ? 'Leave empty for a handwritten From line' : 'Leave empty to sign by hand'}
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
              <Field label="Personal note heading">
                <input type="text" value={copy.giftcard_personal_heading} onChange={e => setField('giftcard_personal_heading', e.target.value)} maxLength={500} style={input} />
              </Field>
              <Field label="Personal sign-off">
                <input type="text" value={copy.giftcard_personal_signoff} onChange={e => setField('giftcard_personal_signoff', e.target.value)} maxLength={500} style={input} />
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
            PREVIEW · 1.75× ACTUAL SIZE (folded card is {CARD_W} × {CARD_H} mm)
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', zoom: 1.75 }}>
            <div>
              <div style={previewTag}>FRONT</div>
              <div style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.14)' }}>
                <CardFront copy={copy} bg={previewBg} />
              </div>
            </div>
            <div>
              <div style={previewTag}>BACK</div>
              <div style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.14)' }}>
                <CardBack copy={copy} fromName={fromName} mode={mode} bg={previewBg} />
              </div>
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: '11px', color: C.muted, marginTop: '16px', lineHeight: 1.7 }}>
            <div style={{ background: '#FEF3C7', color: '#92400E', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', fontWeight: 600 }}>
              In the print dialog, turn <b>Two-Sided OFF</b>. Each page is a separate sheet of {PER_SHEET} cards.
            </div>
            Print on 200–250gsm card at 100% scale (turn off &ldquo;fit to page&rdquo;).<br />
            Cut on the grey dashed lines, then fold on the gold dotted line with the print facing out (the fold sits at the top)
            (score it first for a crisp fold). Each sheet gives {PER_SHEET} cards; the inside stays blank for a note.
          </div>
        </div>
      </div>

      {/* ── Print output: open cards (back over front), 6 per A4 ── */}
      {sheets.map((n, i) => (
        <PrintSheet
          key={i}
          count={n}
          back={<CardBack copy={copy} fromName={fromName} mode={mode} bg={printBg} />}
          front={<CardFront copy={copy} bg={printBg} />}
        />
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
