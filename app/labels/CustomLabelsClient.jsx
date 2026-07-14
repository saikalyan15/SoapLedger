'use client';

import { Layers, Plus, Printer, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const BASE_LABELS = {
  Glycerine: 'Glycerine',
  'Goat Milk': 'Goat Milk',
  'Shea Butter': 'Shea Butter',
  'Red Wine': 'Red Wine',
  Loofah: 'Loofah',
  Travel: '',
};

const COLORS = {
  brand: '#1B4332',
  text: '#000000',
  muted: '#4B5563',
};

const FONTS = {
  sans: '"Plus Jakarta Sans", "Inter", Arial, sans-serif',
};

const WavyDivider = ({ color = COLORS.brand, opacity = 0.3 }) => (
  <svg
    viewBox="0 0 200 8"
    preserveAspectRatio="none"
    style={{
      width: '100%',
      height: '3px',
      display: 'block',
      margin: '0.2mm 0',
    }}
  >
    <path
      d="M0,4 C12.5,0 12.5,8 25,4 C37.5,0 37.5,8 50,4 C62.5,0 62.5,8 75,4 C87.5,0 87.5,8 100,4 C112.5,0 112.5,8 125,4 C137.5,0 137.5,8 150,4 C162.5,0 162.5,8 175,4 C187.5,0 187.5,8 200,4"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeOpacity={opacity}
    />
  </svg>
);

function getFullIngredients(baseType, additionalIngredients) {
  const base = BASE_LABELS[baseType];
  const baseText = base ? `${base} Soap Base` : 'Soap Base';
  if (!additionalIngredients?.trim()) return baseText;
  return `${baseText}, ${additionalIngredients.trim()}`;
}

function ProductLabel({ label, license }) {
  return (
    <div className="product-label">
      {/* White overlay for readability over background image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.65)',
          zIndex: 0,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '0.5mm 1.5mm',
        }}
      >
        {/* Product name — prominent in 15mm height */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '7.5pt',
            fontWeight: 800,
            color: COLORS.brand,
            lineHeight: 1,
            marginTop: '0.2mm',
            marginBottom: '0.3mm',
          }}
        >
          {label.product_name}
        </div>

        <WavyDivider opacity={0.3} />

        {/* Ingredients — very compact */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '4.8pt',
              color: COLORS.text,
              lineHeight: 1,
              fontWeight: 500,
              background: 'rgba(255,255,255,0.60)',
              borderRadius: '0.5mm',
              padding: '0.1mm 0.5mm',
              width: '100%',
              boxSizing: 'border-box',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {getFullIngredients(label.base_type, label.ingredients)}
          </div>
        </div>

        {/* Bottom row: Weight + BBE only */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2mm',
            marginTop: '0.3mm',
          }}
        >
          <div style={{ fontSize: '4.5pt', fontWeight: 700, color: COLORS.text }}>
            Wt: {label.weight_grams}g
          </div>
          <div style={{ fontSize: '4.5pt', fontWeight: 700, color: COLORS.text }}>
            BBE: ______
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniProductLabel({ label, license }) {
  return (
    <div className="mini-label">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.82)',
          zIndex: 0,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '0.4mm 1.5mm',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: '6.5pt',
            fontWeight: 800,
            color: COLORS.brand,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label.product_name}
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: '4.2pt',
              color: COLORS.text,
              fontWeight: 500,
              lineHeight: 1.15,
              textAlign: 'center',
              width: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {getFullIngredients(label.base_type, label.ingredients)}
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: '3.8pt',
            fontWeight: 700,
            color: COLORS.text,
            letterSpacing: '0.03em',
          }}
        >
          {license}
        </div>
      </div>
    </div>
  );
}

function SoapBand({ license }) {
  return (
    <div className="soap-band-container">
      {/* Cutting guidelines — thin dashed line for print, text for screen */}
      <div className="cutting-guide">
        <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
        <span className="no-print" style={{ fontSize: '10px', color: '#999', padding: '0 8px' }}>Cut Line</span>
        <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
      </div>
      
      <div className="soap-band">
        {/* Notice: No white background overlay. We want the kraft paper to show through the background image natively */}

        <div
          className="band-grid"
          style={{ position: 'relative', zIndex: 1, height: '100%' }}
        >
          {/* Panel 1: Left glue tab — 50mm, overlaps on back */}
          <div
            className="band-panel"
            style={{
              padding: '2mm',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
            }}
          >
            <span style={{ fontSize: '5pt', color: COLORS.muted }}>
              healingsoil.in
            </span>
          </div>

          {/* Panel 2: Left side — 24mm depth */}
          <div className="band-panel" />

          {/* Panel 3: Front face — 54mm length */}
          <div
            className="band-panel"
            style={{
              padding: '1.5mm 2mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Logo at Top — safely away from cut line */}
            <img
              src="/logo/healing-soil-v2.1.png"
              style={{ width: '22mm', height: 'auto' }}
            />

            {/* Clear space for sticker in middle */}
            <div style={{ flex: 1 }}></div>

            {/* Udyam at Bottom — safely away from cut line */}
            <div
              style={{
                fontSize: '5pt',
                fontWeight: 800,
                color: COLORS.text,
                letterSpacing: '0.05em',
                padding: '0.1mm 1mm',
              }}
            >
              {license}
            </div>
          </div>

          {/* Panel 4: Right side — 24mm depth */}
          <div className="band-panel" />

          {/* Panel 5: Right glue tab — 50mm, overlaps on back */}
          <div className="band-panel" />
        </div>
      </div>

      {/* Print-only cutting guides */}
      <div className="print-guide only-print"></div>
    </div>
  );
}

export default function CustomLabelsClient({ products, businessConfig }) {
  // Each batch: { id, product_name, base_type, weight_grams, ingredients, qty }
  const [batches, setBatches] = useState([]);
  // Multi-select product checklist — lets you check/uncheck individual
  // products (or Select All / Deselect All) before adding them together,
  // instead of picking one product from a dropdown at a time.
  const [checkedIds, setCheckedIds] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [printMode, setPrintMode] = useState('bands'); // 'stickers' | 'bands'
  const [bandPages, setBandPages] = useState(1);

  // Stickers: 55x20mm, 3x14 grid. Mini: 40x18mm, 4x14 grid. Bands: 35mm height, 8 per sheet.
  const labelsPerPage = printMode === 'stickers' ? 42 : printMode === 'mini' ? 56 : 8;

  const allChecked = products.length > 0 && checkedIds.length === products.length;

  const toggleProduct = (id) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setCheckedIds(allChecked ? [] : products.map((p) => p.id));
  };

  // Adds every checked product to the queue in one click, using the shared
  // quantity field as the count for each — covers single-add (check one),
  // add-all (Select All), and everything in between (check a few).
  const addSelectedToQueue = () => {
    const existingIds = new Set(batches.map((b) => b.product_id));
    const toAdd = products.filter((p) => checkedIds.includes(p.id) && !existingIds.has(p.id));
    if (toAdd.length === 0) return;
    const now = Date.now();
    const newBatches = toAdd.map((p, i) => ({
      id: now + i,
      product_id: p.id,
      product_name: p.name,
      base_type: p.base_type,
      weight_grams: p.weight_grams,
      ingredients: p.ingredients,
      qty: quantity,
    }));
    setBatches((prev) => [...prev, ...newBatches]);
    setCheckedIds([]);
  };

  const removeBatch = (id) =>
    setBatches((prev) => prev.filter((b) => b.id !== id));
  const clearAll = () => setBatches([]);

  // Expand batches into flat label list for the print grid
  const queue = useMemo(() => {
    if (printMode === 'bands') {
      // For bands, we just fill the requested number of pages (8 per page)
      return Array.from({ length: bandPages * 8 }, (_, i) => ({ uid: `band-${i}` }));
    }
    return batches.flatMap((b) =>
      Array.from({ length: b.qty }, (_, i) => ({ uid: `${b.id}-${i}`, ...b })),
    );
  }, [batches, printMode, bandPages]);

  const totalLabels = queue.length;

  const pages = [];
  for (let i = 0; i < queue.length; i += labelsPerPage) {
    pages.push(queue.slice(i, i + labelsPerPage));
  }

  return (
    <div className="labels-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @page {
          size: A4 portrait;
          margin: 0;
        }
        .labels-page {
          background: #f0ede8;
          padding: 20px;
          min-height: 100vh;
          font-family: ${FONTS.sans};
        }

        .product-label {
          width: 55mm;
          height: 20mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background-image: url('/label-bg.png');
          background-size: cover;
          background-position: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .mini-label {
          width: 40mm;
          height: 18mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background-image: url('/label-bg.png');
          background-size: cover;
          background-position: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .soap-band-container {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .soap-band {
          width: 202mm;
          height: 35mm;
          border: 0.1mm dashed #999;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background-image: url('/label-bg.png');
          background-size: cover;
          background-position: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .cutting-guide {
          width: 100%;
          max-width: 210mm;
          display: flex;
          align-items: center;
          padding: 8px 0;
        }

        .band-grid {
          display: grid;
          grid-template-columns: 50mm 24mm 54mm 24mm 50mm;
          height: 100%;
          align-items: stretch;
        }
        .band-panel:nth-child(2),
        .band-panel:nth-child(3) {
          border-right: 1px dashed rgba(0, 0, 0, 0.5);
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block;
          }
          .page-separator {
            display: none !important;
          }
          .labels-page {
            background: white !important;
            padding: 0 !important;
            min-height: 0 !important;
          }

          .label-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(3, 55mm) !important;
            gap: 5mm !important;
            padding: 6mm 8mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
          }
          .label-page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .mini-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(4, 40mm) !important;
            gap: 2mm !important;
            padding: 8mm 22mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
          }
          .mini-page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .band-page-sheet {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            /* 6mm top clears printer hardware margins; 8 x 35mm bands = 280mm,
               leaving ~11mm at the bottom of the 297mm page */
            padding: 6mm 0 0 !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always;
            break-after: page;
            gap: 0 !important;
            overflow: hidden !important;
          }
          .band-page-sheet:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Each band prints its own dashed border, which is the cut line —
             the extra guide rows would push the stack past 297mm */
          .cutting-guide {
            display: none !important;
          }

          .product-label {
            width: 55mm !important;
            height: 20mm !important;
            border: 0.1mm dashed #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .mini-label {
            width: 40mm !important;
            height: 18mm !important;
            border: 0.1mm dashed #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .soap-band-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .soap-band {
            border: 0.1mm dashed #999 !important;
            margin-bottom: 0 !important;
          }
          
          .soap-band-container:last-child .soap-band {
             /* preserve bottom border for the last one */
          }

          .print-guide {
            width: 100%;
            height: 0;
            border-top: 0.1mm dashed #000;
            position: absolute;
            left: 0;
            right: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Slim control bar */}
      <div
        className="no-print"
        style={{
          maxWidth: '860px',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          <button
            onClick={() => setPrintMode('bands')}
            style={{
              background: printMode === 'bands' ? COLORS.brand : 'transparent',
              color: printMode === 'bands' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Wrapper Bands
          </button>
          <button
            onClick={() => setPrintMode('stickers')}
            style={{
              background: printMode === 'stickers' ? COLORS.brand : 'transparent',
              color: printMode === 'stickers' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Label Prints
          </button>
          <button
            onClick={() => setPrintMode('mini')}
            style={{
              background: printMode === 'mini' ? COLORS.brand : 'transparent',
              color: printMode === 'mini' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Mini Stickers
          </button>
        </div>

        {/* Bands: page count inline */}
        {printMode === 'bands' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: COLORS.muted, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>Pages:</label>
            <input
              type="number"
              min={1}
              max={20}
              value={bandPages}
              onChange={(e) => setBandPages(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              style={{
                width: '60px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                fontFamily: FONTS.sans,
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>{totalLabels} bands</span>
          </div>
        )}

        {/* Stickers / Mini: qty + add-selected inline */}
        {(printMode === 'stickers' || printMode === 'mini') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', color: COLORS.muted, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>Qty each:</label>
            <input
              type="number"
              min={1}
              max={200}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontFamily: FONTS.sans, boxSizing: 'border-box' }}
            />
            <button
              onClick={addSelectedToQueue}
              disabled={checkedIds.length === 0}
              style={{
                padding: '6px 14px',
                background: checkedIds.length > 0 ? COLORS.brand : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: checkedIds.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONTS.sans,
              }}
            >
              <Plus size={14} /> Add Selected{checkedIds.length > 0 ? ` (${checkedIds.length})` : ''}
            </button>
            {batches.length > 0 && (
              <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>{totalLabels} label{totalLabels !== 1 ? 's' : ''} · {pages.length} page{pages.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}

        {/* Print button — pushed to right */}
        <button
          onClick={() => window.print()}
          disabled={totalLabels === 0}
          style={{
            marginLeft: 'auto',
            background: totalLabels === 0 ? '#E5E7EB' : COLORS.brand,
            color: totalLabels === 0 ? '#9CA3AF' : 'white',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '7px',
            fontWeight: 700,
            cursor: totalLabels === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontFamily: FONTS.sans,
          }}
        >
          <Printer size={15} /> Print ({totalLabels})
        </button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Product checklist — check/uncheck individual products, or Select all / Deselect all */}
        {(printMode === 'stickers' || printMode === 'mini') && (
          <div className="no-print" style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: FONTS.sans }}>
                Products {checkedIds.length > 0 ? `(${checkedIds.length} selected)` : ''}
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{ background: 'none', border: 'none', color: COLORS.brand, fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: FONTS.sans }}
              >
                {allChecked ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {products.map((p) => {
                const checked = checkedIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px 5px 8px',
                      borderRadius: '20px',
                      border: `1px solid ${checked ? COLORS.brand : '#E5E7EB'}`,
                      background: checked ? '#D8F3DC' : 'white',
                      fontSize: '12px',
                      fontFamily: FONTS.sans,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      style={{ margin: 0, accentColor: COLORS.brand, cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: checked ? 700 : 500, color: checked ? COLORS.brand : COLORS.text }}>
                      {p.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticker / Mini batch list — compact */}
        {(printMode === 'stickers' || printMode === 'mini') && batches.length > 0 && (
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {batches.map((batch) => (
              <div
                key={batch.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '4px 10px 4px 6px',
                  fontSize: '12px',
                  fontFamily: FONTS.sans,
                }}
              >
                <span style={{ background: COLORS.brand, color: 'white', borderRadius: '12px', padding: '1px 7px', fontWeight: 800, fontSize: '11px' }}>{batch.qty}</span>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{batch.product_name}</span>
                <button onClick={() => removeBatch(batch.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0', lineHeight: 1, display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button onClick={clearAll} style={{ background: 'none', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
              Clear all
            </button>
          </div>
        )}

        {/* A4 page preview + print output */}
        {pages.map((page, pageIdx) => (
          <div key={pageIdx}>
            {/* Page header — screen only */}
            <div
              className="page-separator no-print"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                Page {pageIdx + 1} of {pages.length} — {page.length} {printMode === 'bands' ? 'bands' : 'labels'}
              </div>
              <div style={{ flex: 1, height: '1px', background: '#D1D5DB' }} />
            </div>

            {/* A4 sheet — white card in browser, actual print page when printing */}
            <div
              className={
                printMode === 'stickers'
                  ? 'label-page-sheet'
                  : printMode === 'mini'
                  ? 'mini-page-sheet'
                  : 'band-page-sheet'
              }
              style={{
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                marginBottom: '32px',
                padding:
                  printMode === 'stickers' ? '10mm' : printMode === 'mini' ? '8mm 22mm' : '8mm 0 0',
                display: printMode === 'bands' ? 'flex' : 'grid',
                gridTemplateColumns:
                  printMode === 'stickers'
                    ? 'repeat(3, 60mm)'
                    : printMode === 'mini'
                    ? 'repeat(4, 40mm)'
                    : 'none',
                flexDirection: printMode === 'bands' ? 'column' : 'row',
                alignItems: 'center',
                gap: printMode === 'stickers' ? '5mm' : printMode === 'mini' ? '2mm' : '2mm',
                width: '210mm',
                height: 'auto',
                minHeight: '297mm',
                margin: '0 auto 32px auto',
                boxSizing: 'border-box',
              }}
            >
              {page.map((label) =>
                printMode === 'stickers' ? (
                  <ProductLabel key={label.uid} label={label} license={businessConfig.brand.license} />
                ) : printMode === 'mini' ? (
                  <MiniProductLabel key={label.uid} label={label} license={businessConfig.brand.license} />
                ) : (
                  <SoapBand key={label.uid} license={businessConfig.brand.license} />
                ),
              )}
              {/* Final cutting guide for the bottom edge — screen-only text, print-only line */}
              {printMode === 'bands' && (
                <div className="cutting-guide" style={{ marginTop: '-8px' }}>
                  <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
                  <span className="no-print" style={{ fontSize: '10px', color: '#999', padding: '0 8px' }}>Bottom Edge</span>
                  <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {totalLabels === 0 && (
          <div
            className="no-print"
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: COLORS.muted,
              fontSize: '14px',
            }}
          >
            <Tag
              size={40}
              style={{
                opacity: 0.2,
                marginBottom: '12px',
                display: 'block',
                margin: '0 auto 12px',
              }}
            />
            {printMode === 'bands'
              ? 'Add pages to see the wrapper bands preview.'
              : 'Check one or more products above, then Add Selected to see the A4 page preview.'}
          </div>
        )}
      </div>
    </div>
  );
}
