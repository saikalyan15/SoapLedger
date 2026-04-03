'use client';

import React, { useState } from 'react';
import { Printer, Plus, Trash2, Tag } from 'lucide-react';
import businessConfig from '@/lib/config/business.json';

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
    style={{ width: '100%', height: '3px', display: 'block', margin: '0.5mm 0' }}
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

function formatBBE(dateStr) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 12);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

const today = () => new Date().toISOString().split('T')[0];

export default function CustomLabelsClient({ products }) {
  const [queue, setQueue] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [labelDate, setLabelDate] = useState(today());

  const addToQueue = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    const batchId = Date.now();
    const newLabels = Array.from({ length: quantity }, (_, i) => ({
      uid: `${batchId}-${i}`,
      product_name: product.name,
      base_type: product.base_type,
      weight_grams: product.weight_grams,
      ingredients: product.ingredients,
      order_date: labelDate,
    }));
    setQueue(prev => [...prev, ...newLabels]);
  };

  const removeLabel = (uid) => setQueue(prev => prev.filter(l => l.uid !== uid));

  const clearAll = () => setQueue([]);

  return (
    <div className="labels-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @page { size: A4; margin: 8mm; }
        .labels-page { background: #F0EDE8; padding: 20px; min-height: 100vh; font-family: ${FONTS.sans}; }

        .product-label {
          width: 60mm; height: 40mm; background: white;
          padding: 2.5mm 3.5mm; display: flex; flex-direction: column; position: relative;
          box-sizing: border-box; overflow: hidden;
        }

        @media print {
          .no-print { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; min-height: 0 !important; }

          .product-grid { display: grid; grid-template-columns: repeat(3, 60mm); gap: 4mm; }
          .product-label {
            width: 60mm !important; height: 40mm !important;
            page-break-inside: avoid !important;
            padding: 2.5mm 3.5mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }

          * { color: #000000 !important; border-color: #000000 !important; }
          .product-label div { background: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: COLORS.brand, color: 'white', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', maxWidth: '860px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Tag size={20} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>Custom Label Print</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>{queue.length} label{queue.length !== 1 ? 's' : ''} queued</div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          disabled={queue.length === 0}
          style={{ background: queue.length === 0 ? 'rgba(255,255,255,0.3)' : 'white', color: COLORS.brand, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, cursor: queue.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <Printer size={18} /> Print ({queue.length})
        </button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Form */}
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

            <div style={{ flex: '0 1 80px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: COLORS.muted, marginBottom: '4px' }}>Qty</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', fontFamily: FONTS.sans, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: COLORS.muted, marginBottom: '4px' }}>Label Date (for BBE)</label>
              <input
                type="date"
                value={labelDate}
                onChange={e => setLabelDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', fontFamily: FONTS.sans, boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={addToQueue}
              disabled={!selectedProductId}
              style={{ padding: '8px 16px', background: selectedProductId ? COLORS.brand : '#9CA3AF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: selectedProductId ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', height: '38px' }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Queue summary */}
        {queue.length > 0 && (
          <div className="no-print" style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: COLORS.brand }}>Queue ({queue.length})</div>
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={13} /> Clear all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {queue.map((label, idx) => (
                <div key={label.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F9FAFB', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ color: COLORS.text }}>
                    <span style={{ fontWeight: 600 }}>#{idx + 1}</span> — {label.product_name}
                    <span style={{ color: COLORS.muted, marginLeft: '8px', fontSize: '11px' }}>BBE: {formatBBE(label.order_date)}</span>
                  </span>
                  <button onClick={() => removeLabel(label.uid)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labels preview */}
        {queue.length > 0 && (
          <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {queue.map(label => (
              <div key={label.uid} className="product-label">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm', marginBottom: '0.5mm' }}>
                  <img src="/HealingSoil-Formatted.png" style={{ width: '5mm', height: '5mm', borderRadius: '50%' }} />
                  <div style={{ fontSize: '6.5pt', fontWeight: 800, color: COLORS.brand, letterSpacing: '0.05em' }}>{businessConfig.brand.name}</div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '10.5pt', fontWeight: 800, color: COLORS.brand, lineHeight: 1.1, margin: '0.5mm 0' }}>
                  {label.product_name}
                </div>

                <WavyDivider opacity={0.3} />

                <div style={{ fontSize: '8pt', color: COLORS.text, lineHeight: 1.25, flex: 1, overflow: 'hidden', padding: '0.2mm 0', fontWeight: 500 }}>
                  <span style={{ fontWeight: 800 }}>Ingredients:</span> {getFullIngredients(label.base_type, label.ingredients)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.5pt', color: COLORS.text, borderTop: '0.1mm solid #CCC', paddingTop: '0.8mm', marginTop: '0.2mm', fontWeight: 700 }}>
                  <span>Wt: {label.weight_grams}g</span>
                  <span>Exp: {formatBBE(label.order_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {queue.length === 0 && (
          <div className="no-print" style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.muted, fontSize: '14px' }}>
            <Tag size={40} style={{ opacity: 0.2, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
            Select a product and click Add to build your print queue.
          </div>
        )}
      </div>
    </div>
  );
}
