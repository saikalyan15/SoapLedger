'use client';

import businessConfig from '@/lib/config/business.json';
import { Plus, Printer, Tag, Trash2 } from 'lucide-react';
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

function ProductLabel({ label }) {
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
        {/* Product name — prominent in 20mm height */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '8pt',
            fontWeight: 800,
            color: COLORS.brand,
            lineHeight: 1,
            marginTop: '0.5mm',
            marginBottom: '0.5mm',
          }}
        >
          {label.product_name}
        </div>

        <WavyDivider opacity={0.3} />

        {/* Ingredients — compact */}
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
              fontSize: '5pt',
              color: COLORS.text,
              lineHeight: 1,
              fontWeight: 500,
              background: 'rgba(255,255,255,0.60)',
              borderRadius: '0.5mm',
              padding: '0.2mm 0.5mm',
              width: '100%',
              boxSizing: 'border-box',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            <span style={{ fontWeight: 800 }}>Ingredients: </span>
            {getFullIngredients(label.base_type, label.ingredients)}
          </div>
        </div>

        {/* Bottom row: Weight + BBE only (License is on band) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2mm',
            marginTop: '0.5mm',
          }}
        >
          <div
            style={{
              fontSize: '5pt',
              fontWeight: 700,
              color: COLORS.text,
              background: 'rgba(255,255,255,0.7)',
              padding: '0.1mm 0.8mm',
              borderRadius: '0.5mm',
            }}
          >
            Wt: {label.weight_grams}g
          </div>
          <div
            style={{
              fontSize: '5pt',
              fontWeight: 700,
              color: COLORS.text,
              background: 'rgba(255,255,255,0.7)',
              padding: '0.1mm 0.8mm',
              borderRadius: '0.5mm',
            }}
          >
            BBE: ______
          </div>
        </div>
      </div>
    </div>
  );
}

function SoapBand() {
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
          {/* Panel 1: Back Left Overlap (35mm) - Glued underneath */}
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

          {/* Panel 2: Left Side (22mm) */}
          <div
            className="band-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                transform: 'rotate(-90deg)',
                fontSize: '5.5pt',
                fontWeight: 800,
                color: COLORS.brand,
                letterSpacing: '0.2em',
                whiteSpace: 'nowrap',
              }}
            >
              HANDCRAFTED
            </span>
          </div>

          {/* Panel 3: Front Face (57mm) */}
          <div
            className="band-panel"
            style={{
              padding: '2.5mm 2mm', /* Increased top/bottom padding to clear cut lines */
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            {/* Logo at Top — safely away from cut line */}
            <img
              src="/HealingSoil-Formatted.png"
              style={{ width: '10mm', height: '10mm', borderRadius: '50%' }}
            />

            {/* Clear space for 20mm sticker in middle */}
            <div style={{ flex: 1 }}></div>

            {/* Udyam at Bottom — safely away from cut line */}
            <div
              style={{
                fontSize: '5pt',
                fontWeight: 800,
                color: COLORS.text,
                letterSpacing: '0.05em',
                background: 'rgba(255,255,255,0.3)',
                padding: '0.2mm 1mm',
                borderRadius: '0.5mm',
              }}
            >
              {businessConfig.brand.license}
            </div>
          </div>

          {/* Panel 4: Right Side (22mm) */}
          <div
            className="band-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                transform: 'rotate(90deg)',
                fontSize: '5.5pt',
                fontWeight: 800,
                color: COLORS.brand,
                letterSpacing: '0.2em',
                whiteSpace: 'nowrap',
              }}
            >
              100% NATURAL
            </span>
          </div>

          {/* Panel 5: Back Right Overlap (35mm) - Glued on top */}
          <div
            className="band-panel"
            style={{
              padding: '2mm',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ fontSize: '5pt', color: COLORS.muted }}>
              Made in Goa
            </span>
          </div>
        </div>
      </div>

      {/* Print-only cutting guides */}
      <div className="print-guide only-print"></div>
    </div>
  );
}

export default function CustomLabelsClient({ products }) {
  // Each batch: { id, product_name, base_type, weight_grams, ingredients, qty }
  const [batches, setBatches] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [printMode, setPrintMode] = useState('bands'); // 'stickers' | 'bands'
  const [bandPages, setBandPages] = useState(1);

  // 36mm height (40% of 90mm) allows us to print exactly 7 bands per A4 sheet
  const labelsPerPage = printMode === 'stickers' ? 42 : 7;

  const addToQueue = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setBatches((prev) => [
      ...prev,
      {
        id: Date.now(),
        product_name: product.name,
        base_type: product.base_type,
        weight_grams: product.weight_grams,
        ingredients: product.ingredients,
        qty: quantity,
      },
    ]);
  };

  const removeBatch = (id) =>
    setBatches((prev) => prev.filter((b) => b.id !== id));
  const clearAll = () => setBatches([]);

  // Expand batches into flat label list for the print grid
  const queue = useMemo(() => {
    if (printMode === 'bands') {
      // For bands, we just fill the requested number of pages (7 per page)
      return Array.from({ length: bandPages * 7 }, (_, i) => ({ uid: `band-${i}` }));
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

        .soap-band-container {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .soap-band {
          width: 171mm;
          height: 36mm;
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
            padding: 10mm !important;
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

          .band-page-sheet {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: 12mm 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 210mm !important;
            box-sizing: border-box !important;
            page-break-after: always;
            break-after: page;
            gap: 2mm !important;
          }
          .band-page-sheet:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          .cutting-guide {
            padding: 0 !important;
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

      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          background: COLORS.brand,
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          maxWidth: '860px',
          margin: '0 auto 20px auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Tag size={20} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              Print
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              {printMode === 'bands' ? `${bandPages} page(s) · ${totalLabels} bands` : `${totalLabels} item(s) · ${pages.length} page(s)`}
            </div>
          </div>
        </div>

        {/* Print Mode Toggle */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '10px',
            padding: '5px',
            gap: '5px',
          }}
        >
          <button
            onClick={() => setPrintMode('bands')}
            style={{
              background: printMode === 'bands' ? 'white' : 'transparent',
              color: printMode === 'bands' ? COLORS.brand : 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: printMode === 'bands' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Wrapper Bands
          </button>
          <button
            onClick={() => setPrintMode('stickers')}
            style={{
              background: printMode === 'stickers' ? 'white' : 'transparent',
              color: printMode === 'stickers' ? COLORS.brand : 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: printMode === 'stickers' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Label Prints
          </button>
        </div>

        <button
          onClick={() => window.print()}
          disabled={totalLabels === 0}
          style={{
            background: totalLabels === 0 ? 'rgba(255,255,255,0.3)' : 'white',
            color: COLORS.brand,
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 800,
            cursor: totalLabels === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <Printer size={18} /> Print ({totalLabels})
        </button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Configuration Panel */}
        <div
          className="no-print"
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #E5E7EB',
          }}
        >
          {printMode === 'bands' ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: COLORS.brand, marginBottom: '14px' }}>
                Configure Wrapper Bands
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: '0 1 150px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: COLORS.muted, marginBottom: '4px' }}>
                    Number of Pages
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bandPages}
                    onChange={(e) => setBandPages(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      fontFamily: FONTS.sans,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: COLORS.muted, paddingBottom: '10px' }}>
                  Each page contains 7 generic wrapper bands with cutting guidelines.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: COLORS.brand,
                  marginBottom: '14px',
                }}
              >
                Add Labels to Queue
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ flex: '2 1 200px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: COLORS.muted,
                      marginBottom: '4px',
                    }}
                  >
                    Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      fontFamily: FONTS.sans,
                    }}
                  >
                    <option value="">— Select a product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.base_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: '0 1 100px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: COLORS.muted,
                      marginBottom: '4px',
                    }}
                  >
                    Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(1, Math.min(200, parseInt(e.target.value) || 1)),
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      fontFamily: FONTS.sans,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  onClick={addToQueue}
                  disabled={!selectedProductId}
                  style={{
                    padding: '8px 16px',
                    background: selectedProductId ? COLORS.brand : '#9CA3AF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: selectedProductId ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    height: '38px',
                  }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </>
          )}
        </div>

        {/* Print list — only for stickers */}
        {printMode === 'stickers' && batches.length > 0 && (
          <div
            className="no-print"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: COLORS.brand,
                }}
              >
                Print list — {totalLabels} label{totalLabels !== 1 ? 's' : ''}{' '}
                across {pages.length} A4 page{pages.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={13} /> Clear all
              </button>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: COLORS.brand,
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 800,
                      }}
                    >
                      {batch.qty}
                    </span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>
                      {batch.product_name}
                    </span>
                    <span style={{ fontSize: '11px', color: COLORS.muted }}>
                      {batch.base_type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeBatch(batch.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
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
              className={printMode === 'stickers' ? 'label-page-sheet' : 'band-page-sheet'}
              style={{
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                marginBottom: '32px',
                padding: printMode === 'stickers' ? '10mm' : '21mm 0',
                display: printMode === 'stickers' ? 'grid' : 'flex',

                gridTemplateColumns:
                  printMode === 'stickers' ? 'repeat(3, 60mm)' : 'none',
                flexDirection: printMode === 'bands' ? 'column' : 'row',
                alignItems: 'center',
                gap: printMode === 'stickers' ? '5mm' : '2mm',
                width: '210mm',
                height: 'auto',
                minHeight: '297mm',
                margin: '0 auto 32px auto',
                boxSizing: 'border-box',
              }}
            >
              {page.map((label) =>
                printMode === 'stickers' ? (
                  <ProductLabel key={label.uid} label={label} />
                ) : (
                  <SoapBand key={label.uid} />
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
            {printMode === 'stickers' 
              ? 'Select a product and add labels to see the A4 page preview.'
              : 'Add pages to see the wrapper bands preview.'}
          </div>
        )}
      </div>
    </div>
  );
}
