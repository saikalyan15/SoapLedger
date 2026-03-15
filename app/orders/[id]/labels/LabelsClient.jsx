'use client';

import React, { useState } from 'react';
import { Check, X, Printer, ArrowLeft, Square, CheckSquare, Truck, Tag } from 'lucide-react';

const BASE_LABELS = {
  'Glycerine':   'Glycerine',
  'Goat Milk':   'Goat Milk',
  'Shea Butter': 'Shea Butter',
  'Red Wine':    'Red Wine',
  'Loofah':      'Loofah',
  'Travel':      '',
};

const WavyDivider = ({ color = '#1B4332', opacity = 0.4 }) => (
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

const LabelsClient = ({ labels, orderInfo }) => {
  // We add +1 to the selected IDs to account for the shipping label (index -1)
  const [selectedIds, setSelectedIds] = useState(new Set([...labels.map((_, i) => i), -1]));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const formatBBE = (dateStr) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 12);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const toggleLabel = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  return (
    <div className="labels-page">
      <style jsx global>{`
        @page { size: A4; margin: 10mm; }
        .labels-page { background: #F0EDE8; padding: 20px; min-height: 100vh; font-family: Arial, sans-serif; }
        .section-header { font-family: 'DM Serif Display', serif; color: #1B4332; margin: 30px 0 15px 0; display: flex; alignItems: center; gap: 10px; }
        
        /* Product Label - Web View */
        .product-label {
          width: 60mm; height: 40mm; background: white; border: 1px dashed #CCC;
          padding: 3mm; display: flex; flex-direction: column; position: relative;
          cursor: pointer; transition: opacity 0.2s;
        }
        
        /* Shipping Label - Web View */
        .shipping-label {
          width: 100mm; min-height: 60mm; background: white; border: 2px solid #1B4332;
          padding: 8mm; display: flex; flex-direction: column; cursor: pointer;
          position: relative;
        }

        .deselected { opacity: 0.3 !important; }

        @media print {
          .no-print { display: none !important; }
          .labels-page { background: white; padding: 0; }
          .deselected { display: none !important; }
          
          .product-grid {
            display: grid;
            grid-template-columns: repeat(3, 60mm);
            gap: 5mm;
            page-break-after: always;
          }

          .product-label {
            width: 60mm !important; height: 40mm !important;
            border: 0.1mm solid #EEE; margin: 0;
          }

          .shipping-container { page-break-before: always; padding-top: 20px; }
          .shipping-label { width: 140mm !important; height: 90mm !important; border: 0.5mm solid black; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: '#1B4332', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px', maxWidth: '800px', margin: '0 auto 30px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Print Center</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>Order #{orderInfo.id.slice(0,8)} | {orderInfo.customer_name}</p>
          </div>
          <button onClick={() => window.print()} style={{ background: 'white', color: '#1B4332', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={20} /> Print Selected ({selectedIds.size})
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h3 className="section-header no-print"><Tag size={20} /> Product Labels (40mm x 60mm)</h3>
        <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {labels.map((label, index) => (
            <div key={index} className={`product-label ${selectedIds.has(index) ? '' : 'deselected'}`} onClick={() => toggleLabel(index)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginBottom: '1mm' }}>
                <img src="/HealingSoil-Formatted.png" style={{ width: '6mm', height: '6mm', borderRadius: '50%' }} />
                <div style={{ fontSize: '7pt', fontWeight: 800, color: '#1B4332' }}>HEALING SOIL</div>
              </div>
              
              <div style={{ textAlign: 'center', fontSize: '10pt', fontWeight: 700, color: '#1B4332', lineHeight: 1.1, margin: '1mm 0' }}>
                {label.product_name}
              </div>

              <WavyDivider opacity={0.3} />

              <div style={{ fontSize: '6.5pt', color: '#4B5563', lineHeight: 1.2, flex: 1, overflow: 'hidden' }}>
                <strong>Ingredients:</strong> {getFullIngredients(label.base_type, label.ingredients)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6pt', color: '#374151', borderTop: '0.1mm solid #EEE', paddingTop: '1mm', marginTop: '1mm' }}>
                <span>Wt: {label.weight_grams}g</span>
                <span>Exp: {formatBBE(label.order_date)}</span>
              </div>
            </div>
          ))}
        </div>

        <h3 className="section-header no-print"><Truck size={20} /> Shipping Label</h3>
        <div className="shipping-container">
          <div className={`shipping-label ${selectedIds.has(-1) ? '' : 'deselected'}`} onClick={() => toggleLabel(-1)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1B4332' }}>HEALING SOIL</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>Standard Courier</div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Ship To:</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'black', marginBottom: '10px' }}>{orderInfo.customer_name}</div>
              <div style={{ fontSize: '16px', lineHeight: 1.4, color: '#1F2937', maxWidth: '80%' }}>
                {orderInfo.customer_address}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Phone: {orderInfo.customer_phone}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px dashed #CCC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                <strong>Return Address:</strong><br />
                Healing Soil, Bangalore, Karnataka<br />
                Ph: +91 9900655322
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Order ID:</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>#{orderInfo.id.slice(0,12).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelsClient;
