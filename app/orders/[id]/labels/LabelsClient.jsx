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
      height: '3px',
      display: 'block',
      margin: '0.3mm 0',
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
          margin: 10mm;
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
          gap: 4mm;
          width: 100%;
          max-width: 180mm;
          box-sizing: border-box;
        }

        .label-container {
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .label-container.deselected {
          opacity: 0.4;
          filter: grayscale(0.5);
        }

        .selection-overlay {
          position: absolute;
          top: 2mm;
          right: 2mm;
          z-index: 10;
          background: white;
          border-radius: 4px;
          padding: 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .label {
          width: 100%;
          height: 45mm;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px dashed #CCCCCC;
          padding: 2.5mm 3.5mm;
          background: #FFFFFF;
          page-break-inside: avoid;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .no-print { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; }
          .label-container.deselected { display: none !important; }

          .labels-grid {
            display: grid;
            grid-template-columns: repeat(2, 88mm);
            gap: 4mm;
            width: auto;
            margin: 0;
            padding: 0;
          }

          .label {
            border: 1px dashed #EEEEEE;
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
        maxWidth: '180mm', 
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Print Labels <span style={{ opacity: 0.5, fontWeight: 400 }}>| Order #{orderInfo.id.slice(0,8)}</span>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
              {selectedIds.size} of {labels.length} labels selected for {orderInfo.customer_name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => window.print()} disabled={selectedIds.size === 0} style={{
              background: '#FFFFFF',
              color: '#1B4332',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: selectedIds.size === 0 ? 0.5 : 1
            }}>
              <Printer size={18} /> Print {selectedIds.size} Labels
            </button>
            <a href={`/orders/${orderInfo.id}`} style={{
              color: '#FFFFFF',
              fontSize: '13px',
              opacity: 0.8,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ArrowLeft size={16} /> Back
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <button onClick={selectAll} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckSquare size={14} /> Select All
          </button>
          <button onClick={clearAll} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Square size={14} /> Clear All
          </button>
        </div>
      </div>

      <div className="labels-grid">
        {labels.map((label, index) => {
          const isSelected = selectedIds.has(index);
          const mfdDate = formatDate(label.order_date);
          const bbeDate = formatBBE(label.order_date);
          
          return (
            <div 
              key={index} 
              className={`label-container ${isSelected ? 'selected' : 'deselected'}`}
              onClick={() => toggleLabel(index)}
            >
              <div className="selection-overlay no-print">
                {isSelected ? (
                  <div style={{ color: '#1B4332' }}><CheckSquare size={20} fill="#1B4332" color="white" /></div>
                ) : (
                  <div style={{ color: '#9CA3AF' }}><Square size={20} /></div>
                )}
              </div>

              <div className="label">
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2mm',
                  paddingBottom: '0.2mm',
                }}>
                  <img
                    src="/HealingSoil-Formatted.png"
                    alt="Logo"
                    style={{
                      width: '8mm',
                      height: '8mm',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{
                      fontSize: '8.5pt',
                      fontWeight: 700,
                      color: '#1B4332',
                      letterSpacing: '0.06em',
                      lineHeight: 1,
                      fontFamily: 'Arial, sans-serif',
                    }}>HEALING SOIL</div>
                    <div style={{
                      fontSize: '6pt',
                      color: '#8B5E3C',
                      fontFamily: 'Arial, sans-serif',
                      marginTop: '1px'
                    }}>healingsoil.in</div>
                  </div>
                </div>

                <WavyDivider color="#1B4332" opacity={0.5} />

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{
                    fontSize: '9pt',
                    fontWeight: 700,
                    color: '#1B4332',
                    lineHeight: 1.1,
                    fontFamily: 'Georgia, serif',
                    textAlign: 'center',
                    marginBottom: '0.3mm',
                  }}>
                    {label.product_name}
                  </div>

                  <div style={{
                    fontSize: '7pt',
                    color: '#8B5E3C',
                    fontStyle: 'italic',
                    fontFamily: 'Georgia, serif',
                    textAlign: 'center',
                    marginBottom: '0.5mm',
                  }}>
                    ~ {label.base_type} Base ~
                  </div>

                  <WavyDivider color="#D4A017" opacity={0.7} />

                  <div style={{
                    fontSize: '6.5pt',
                    fontWeight: 700,
                    color: '#374151',
                    fontFamily: 'Arial, sans-serif',
                    marginBottom: '0.1mm',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em'
                  }}>Ingredients:</div>

                  <div style={{
                    fontSize: '6.5pt',
                    color: '#4B5563',
                    lineHeight: 1.2,
                    fontFamily: 'Arial, sans-serif',
                    flex: 1,
                    overflow: 'hidden',
                  }}>{getFullIngredients(label.base_type, label.ingredients)}</div>

                  <WavyDivider color="#8B5E3C" opacity={0.4} />

                  <div style={{
                    fontSize: '6.5pt',
                    color: '#374151',
                    fontFamily: 'Arial, sans-serif',
                    paddingTop: '0.1mm',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    Net Wt: {label.weight_grams}g &nbsp;|&nbsp;
                    Mfd: {mfdDate} &nbsp;|&nbsp;
                    Exp: {bbeDate}
                  </div>
                </div>

                <WavyDivider color="#8B5E3C" opacity={0.5} />

                {/* Footer */}
                <div style={{
                  paddingTop: '0.5mm',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{
                    fontSize: '5.5pt',
                    color: '#8B5E3C',
                    fontFamily: 'Arial, sans-serif',
                  }}>UDYAM-KR-03-0666485</div>
                  <div style={{
                    fontSize: '5.5pt',
                    color: '#9CA3AF',
                    fontStyle: 'italic',
                    fontFamily: 'Arial, sans-serif',
                  }}>External use only</div>
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
