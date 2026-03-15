'use client';

import React, { useState } from 'react';
import { Check, X, Printer, ArrowLeft, Square, CheckSquare } from 'lucide-react';

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
    style={{
      width: '100%',
      height: '2px',
      display: 'block',
      margin: '0.2mm 0',
    }}
  >
    <path
      d="M0,4 C12.5,0 12.5,8 25,4 C37.5,0 37.5,8 50,4 C62.5,0 62.5,8 75,4 C87.5,0 87.5,8 100,4 C112.5,0 112.5,8 125,4 C137.5,0 137.5,8 150,4 C162.5,0 162.5,8 175,4 C187.5,0 187.5,8 200,4"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
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
  const [selectedIds, setSelectedIds] = useState(new Set(labels.map((_, i) => i)));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const formatBBE = (dateStr) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 12);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const toggleLabel = (index) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => setSelectedIds(new Set(labels.map((_, i) => i)));
  const clearAll = () => setSelectedIds(new Set());

  return (
    <div className="labels-page">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 5mm;
        }

        .labels-page {
          background: #F0EDE8;
          padding: 8mm 8mm 40mm 8mm;
          min-height: 100vh;
          font-family: Arial, sans-serif;
          width: 100%;
          box-sizing: border-box;
        }

        .labels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2mm;
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
        }

        .label-container {
          position: relative;
          cursor: pointer;
        }

        .label-container.deselected {
          opacity: 0.3;
        }

        .selection-overlay {
          position: absolute;
          top: 1mm;
          right: 1mm;
          z-index: 10;
        }

        .label {
          width: 100%;
          height: 45mm;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px dashed #CCCCCC;
          padding: 2mm 3mm;
          background: #FFFFFF;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          .no-print { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; }
          .label-container.deselected { display: none !important; }

          .labels-grid {
            display: grid;
            grid-template-columns: 85mm 85mm;
            grid-auto-rows: 45mm;
            gap: 2mm 5mm;
            width: 100%;
            margin: 0;
            padding: 0;
          }

          .label {
            width: 85mm !important;
            height: 45mm !important;
            border: 0.1mm solid #EEEEEE;
            background: #FFFFFF !important;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="no-print" style={{
        padding: '16px 24px',
        background: '#1B4332',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '24px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '190mm', 
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              Order #{orderInfo.id.slice(0,8)} Labels
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {selectedIds.size} of {labels.length} selected
            </div>
          </div>
          <button onClick={() => window.print()} disabled={selectedIds.size === 0} style={{
            background: '#FFFFFF', color: '#1B4332', border: 'none', borderRadius: '8px',
            padding: '8px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Printer size={18} /> Print Now
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={selectAll} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Select All</button>
          <button onClick={clearAll} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Clear All</button>
        </div>
      </div>

      <div className="labels-grid">
        {labels.map((label, index) => {
          const isSelected = selectedIds.has(index);
          const mfdDate = formatDate(label.order_date);
          const bbeDate = formatBBE(label.order_date);
          
          return (
            <div key={index} className={`label-container ${isSelected ? '' : 'deselected'}`} onClick={() => toggleLabel(index)}>
              <div className="selection-overlay no-print">
                {isSelected ? <CheckSquare size={18} fill="#1B4332" color="white" /> : <Square size={18} color="#9CA3AF" />}
              </div>

              <div className="label">
                {/* Product Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm', marginBottom: '0.2mm' }}>
                  <img src="/HealingSoil-Formatted.png" alt="" style={{ width: '7mm', height: '7mm', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '7.5pt', fontWeight: 800, color: '#1B4332', letterSpacing: '0.04em', lineHeight: 1 }}>HEALING SOIL</div>
                    <div style={{ fontSize: '8pt', fontWeight: 700, color: '#1B4332', marginTop: '1px' }}>{label.product_name}</div>
                  </div>
                </div>

                <WavyDivider color="#1B4332" opacity={0.3} />

                {/* Ingredients & Dates */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '6pt', color: '#4B5563', lineHeight: 1.2, maxHeight: '8.5mm', overflow: 'hidden' }}>
                    <strong>Ingredients:</strong> {getFullIngredients(label.base_type, label.ingredients)}
                  </div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '5.5pt', color: '#374151', padding: '0.5mm 0' }}>
                    <span>Wt: {label.weight_grams}g</span>
                    <span>Mfd: {mfdDate}</span>
                    <span>Exp: {bbeDate}</span>
                  </div>
                </div>

                <div style={{ borderTop: '0.1mm solid #E5E7EB', margin: '0.5mm 0' }}></div>

                {/* Shipping Info - Bottom Section */}
                <div style={{ background: '#F9FAFB', padding: '1mm', borderRadius: '1mm', display: 'flex', flexDirection: 'column', gap: '0.2mm' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5pt', color: '#6B7280', fontWeight: 600 }}>
                    <span>FROM: Healing Soil</span>
                    <span>TO: {orderInfo.customer_name}</span>
                  </div>
                  <div style={{ fontSize: '5pt', color: '#1F2937', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {orderInfo.customer_address} | {orderInfo.customer_phone}
                  </div>
                  <div style={{ fontSize: '4.5pt', color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' }}>
                    UDYAM-KR-03-0666485 | healingsoil.in
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LabelsClient;
