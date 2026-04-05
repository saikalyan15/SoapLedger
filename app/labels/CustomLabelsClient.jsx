'use client';

import React, { useState } from 'react';
import { Printer, Plus, Trash2, Tag } from 'lucide-react';
import businessConfig from '@/lib/config/business.json';

// 3 cols × 6 rows = 18 labels per A4 sheet (60mm × 40mm labels, 4mm gap, 8mm margin)
const LABELS_PER_PAGE = 18;

const BASE_LABELS = {
  'Glycerine':   'Glycerine',
  'Goat Milk':   'Goat Milk',
  'Shea Butter': 'Shea Butter',
  'Red Wine':    'Red Wine',
  'Loofah':      'Loofah',
  'Travel':      '',
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
    style={{ width: '100%', height: '3px', display: 'block', margin: '0.2mm 0' }}
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
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.65)',
        zIndex: 0,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5mm 2.5mm' }}>
        {/* Logo + brand name centered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5mm' }}>
          <img src="/HealingSoil-Formatted.png" style={{ width: '5mm', height: '5mm', borderRadius: '50%' }} />
          <div style={{ fontSize: '5pt', fontWeight: 700, color: COLORS.brand, letterSpacing: '0.08em', marginTop: '0.3mm' }}>
            {businessConfig.brand.name}
          </div>
        </div>

        {/* Product name */}
        <div style={{ textAlign: 'center', fontSize: '9pt', fontWeight: 800, color: COLORS.brand, lineHeight: 1.15, marginBottom: '0.5mm' }}>
          {label.product_name}
        </div>

        <WavyDivider opacity={0.3} />

        {/* Ingredients — white background for guaranteed readability */}
        <div style={{ fontSize: '6pt', color: COLORS.text, lineHeight: 1.15, flex: 1, overflow: 'hidden', fontWeight: 500, background: 'rgba(255,255,255,0.70)', borderRadius: '1mm', padding: '0.5mm 1mm' }}>
          <span style={{ fontWeight: 800 }}>Ingredients: </span>
          {getFullIngredients(label.base_type, label.ingredients)}
        </div>

        {/* Bottom row: Udyam left | Weight + BBE stamp space right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5mm' }}>
          <div style={{ fontSize: '5pt', fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>
            {businessConfig.brand.license}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2mm' }}>
            <div style={{ fontSize: '5.5pt', fontWeight: 700, color: COLORS.text, background: 'rgba(255,255,255,0.7)', padding: '0.3mm 1mm', borderRadius: '1mm' }}>
              Wt: {label.weight_grams}g
            </div>
            <div style={{ fontSize: '5.5pt', fontWeight: 700, color: COLORS.text, background: 'rgba(255,255,255,0.7)', padding: '0.3mm 1mm', borderRadius: '1mm', letterSpacing: '0.02em' }}>
              BBE: ____________
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomLabelsClient({ products }) {
  // Each batch: { id, product_name, base_type, weight_grams, ingredients, qty }
  const [batches, setBatches] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const addToQueue = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    setBatches(prev => [...prev, {
      id: Date.now(),
      product_name: product.name,
      base_type: product.base_type,
      weight_grams: product.weight_grams,
      ingredients: product.ingredients,
      qty: quantity,
    }]);
  };

  const removeBatch = (id) => setBatches(prev => prev.filter(b => b.id !== id));
  const clearAll = () => setBatches([]);

  // Expand batches into flat label list for the print grid
  const queue = batches.flatMap(b =>
    Array.from({ length: b.qty }, (_, i) => ({ uid: `${b.id}-${i}`, ...b }))
  );
  const totalLabels = queue.length;

  // Chunk flat label list into A4 pages of 18
  const pages = [];
  for (let i = 0; i < queue.length; i += LABELS_PER_PAGE) {
    pages.push(queue.slice(i, i + LABELS_PER_PAGE));
  }

  return (
    <div className="labels-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @page { size: A4; margin: 8mm; }
        .labels-page { background: #F0EDE8; padding: 20px; min-height: 100vh; font-family: ${FONTS.sans}; }

        .product-label {
          width: 60mm; height: 40mm;
          border: 1px dashed #CCC;
          display: flex; flex-direction: column; position: relative;
          box-sizing: border-box; overflow: hidden;
          background-image: url('/label-bg.png');
          background-size: cover; background-position: center;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }

        @media print {
          .no-print { display: none !important; }
          .page-separator { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; min-height: 0 !important; }

          .label-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(3, 60mm) !important;
            gap: 4mm !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
          }
          .label-page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .product-label {
            width: 60mm !important; height: 40mm !important;
            border: 0.3mm dashed #000 !important;
            page-break-inside: avoid !important; break-inside: avoid !important;
            box-sizing: border-box !important; overflow: hidden !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }

          * { color: #000000 !important; border-color: #000000 !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        background: COLORS.brand, color: 'white',
        padding: '16px 20px', borderRadius: '12px',
        maxWidth: '860px', margin: '0 auto 20px auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Tag size={20} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>Bulk Label Print</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              {totalLabels} label{totalLabels !== 1 ? 's' : ''} · {pages.length} A4 page{pages.length !== 1 ? 's' : ''} · BBE via rubber stamp
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          disabled={queue.length === 0}
          style={{
            background: totalLabels === 0 ? 'rgba(255,255,255,0.3)' : 'white',
            color: COLORS.brand, border: 'none',
            padding: '10px 20px', borderRadius: '8px',
            fontWeight: 800, cursor: totalLabels === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
          }}
        >
          <Printer size={18} /> Print ({totalLabels})
        </button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Add form */}
        <div className="no-print" style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: COLORS.brand, marginBottom: '14px' }}>Add Labels to Queue</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: COLORS.muted, marginBottom: '4px' }}>Product</label>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', fontFamily: FONTS.sans }}
              >
                <option value="">— Select a product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.base_type})</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '0 1 100px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: COLORS.muted, marginBottom: '4px' }}>Qty</label>
              <input
                type="number"
                min={1}
                max={200}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', fontFamily: FONTS.sans, boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={addToQueue}
              disabled={!selectedProductId}
              style={{
                padding: '8px 16px',
                background: selectedProductId ? COLORS.brand : '#9CA3AF',
                color: 'white', border: 'none', borderRadius: '8px',
                fontWeight: 700, fontSize: '14px',
                cursor: selectedProductId ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap', height: '38px',
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Print list — one row per batch */}
        {batches.length > 0 && (
          <div className="no-print" style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: COLORS.brand }}>
                Print list — {totalLabels} label{totalLabels !== 1 ? 's' : ''} across {pages.length} A4 page{pages.length !== 1 ? 's' : ''}
              </div>
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={13} /> Clear all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {batches.map((batch) => (
                <div key={batch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: '28px', height: '28px', borderRadius: '6px',
                      background: COLORS.brand, color: 'white',
                      fontSize: '13px', fontWeight: 800,
                    }}>
                      {batch.qty}
                    </span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{batch.product_name}</span>
                    <span style={{ fontSize: '11px', color: COLORS.muted }}>{batch.base_type}</span>
                  </div>
                  <button onClick={() => removeBatch(batch.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
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
            <div className="page-separator no-print" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.muted, whiteSpace: 'nowrap' }}>
                Page {pageIdx + 1} of {pages.length} — {page.length} label{page.length !== 1 ? 's' : ''}
              </div>
              <div style={{ flex: 1, height: '1px', background: '#D1D5DB' }} />
            </div>

            {/* A4 sheet — white card in browser, actual print page when printing */}
            <div
              className="label-page-sheet"
              style={{
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                marginBottom: '32px',
                padding: '8mm',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 60mm)',
                gap: '4mm',
                width: 'fit-content',
              }}
            >
              {page.map(label => (
                <ProductLabel key={label.uid} label={label} />
              ))}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {totalLabels === 0 && (
          <div className="no-print" style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.muted, fontSize: '14px' }}>
            <Tag size={40} style={{ opacity: 0.2, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            Select a product and add labels to see the A4 page preview.
          </div>
        )}
      </div>
    </div>
  );
}
