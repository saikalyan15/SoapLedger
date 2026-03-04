'use client';

import React from 'react';

const BASE_LABELS = {
  'Glycerine':   'Glycerine',
  'Goat Milk':   'Goat Milk',
  'Shea Butter': 'Shea Butter',
  'Red Wine':    'Red Wine',
  'Loofah':      'Loofah',
  'Travel':      '',
};

function getFullIngredients(baseType, additionalIngredients) {
  const base = BASE_LABELS[baseType];
  const baseText = base ? `${base} Soap Base` : 'Soap Base';
  if (!additionalIngredients?.trim()) return baseText;
  return `${baseText}, ${additionalIngredients.trim()}`;
}

const LabelsClient = ({ labels, orderInfo }) => {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const formatBBE = (dateStr) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + 12);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="labels-page">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        .labels-page {
          background: #F0EDE8;
          padding: 8mm;
          min-height: 100vh;
          font-family: Arial, sans-serif;
        }

        .labels-grid {
          display: grid;
          grid-template-columns: repeat(2, 88mm);
          gap: 4mm;
          padding: 8mm;
        }

        .label {
          width: 88mm;
          height: 60mm;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1.2px dashed #BBBBBB;
          border-radius: 0;
          padding: 4mm 4.5mm;
          background: #FFFFFF;
          page-break-inside: avoid;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          /* Hide everything except labels grid */
          .no-print { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; }

          /* Let grid flow naturally — NO position fixed */
          .labels-grid {
            display: grid;
            grid-template-columns: repeat(2, 88mm);
            gap: 4mm;
            width: auto;
            margin: 0;
            padding: 0;
          }

          .label {
            background: #FFFFFF !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          img {
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '180mm', 
        boxSizing: 'border-box'
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>
            Print Labels — Order #{orderInfo.id.slice(0,8)}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
            {orderInfo.total_labels} labels · {orderInfo.customer_name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} style={{
            background: '#FFFFFF',
            color: '#1B4332',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            🖨️ Print Labels
          </button>
          <a href={`/orders/${orderInfo.id}`} style={{
            color: '#FFFFFF',
            fontSize: '13px',
            opacity: 0.8,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>← Back to Order</a>
        </div>
      </div>

      <div className="labels-grid">
        {labels.map((label, index) => {
          const mfdDate = formatDate(label.order_date);
          const bbeDate = formatBBE(label.order_date);
          
          return (
            <div key={index} className="label">
              {/* Header — white bg, green bottom border accent */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2.5mm',
                paddingBottom: '1.5mm',
                borderBottom: '0.8pt solid #1B4332',
                marginBottom: '1.5mm',
              }}>
                <img
                  src="/HealingSoil-Formatted.png"
                  alt="Healing Soil"
                  style={{
                    width: '12mm',
                    height: '12mm',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{
                    fontSize: '10pt',
                    fontWeight: 700,
                    color: '#1B4332',
                    letterSpacing: '0.08em',
                    lineHeight: 1.1,
                    fontFamily: 'Arial, sans-serif',
                  }}>HEALING SOIL</div>
                  <div style={{
                    fontSize: '7.5pt',
                    color: '#8B5E3C',
                    fontFamily: 'Arial, sans-serif',
                  }}>healingsoil.in</div>
                </div>
              </div>

              {/* Body — white, no fill */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '10pt',
                  fontWeight: 700,
                  color: '#1B4332',
                  lineHeight: 1.2,
                  fontFamily: 'Arial, sans-serif',
                  marginBottom: '0.5mm',
                }}>{label.product_name}</div>

                <div style={{
                  fontSize: '8pt',
                  color: '#8B5E3C',
                  fontFamily: 'Arial, sans-serif',
                  marginBottom: '1mm',
                }}>{label.base_type} Base</div>

                <div style={{
                  borderTop: '0.3pt solid #D4A017',
                  marginBottom: '1.5mm',
                }} />

                <div style={{
                  fontSize: '8pt',
                  fontWeight: 700,
                  color: '#374151',
                  fontFamily: 'Arial, sans-serif',
                  marginBottom: '0.3mm',
                }}>Ingredients:</div>

                <div style={{
                  fontSize: '8pt',
                  color: '#4B5563',
                  lineHeight: 1.3,
                  fontFamily: 'Arial, sans-serif',
                  flex: 1,
                }}>{getFullIngredients(label.base_type, label.ingredients)}</div>

                <div style={{
                  fontSize: '7.5pt',
                  color: '#374151',
                  fontFamily: 'Arial, sans-serif',
                  borderTop: '0.3pt solid #E5E7EB',
                  paddingTop: '1mm',
                  marginTop: '1mm',
                }}>
                  Net Wt: {label.weight_grams}g &nbsp;|&nbsp;
                  Mfd: {mfdDate} &nbsp;|&nbsp;
                  BBE: {bbeDate}
                </div>
              </div>

              {/* Footer — white bg, thin brown top border */}
              <div style={{
                borderTop: '0.5pt solid #8B5E3C',
                paddingTop: '1mm',
                marginTop: '1mm',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{
                  fontSize: '7pt',
                  color: '#8B5E3C',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.02em',
                }}>UDYAM-KR-03-0666485</div>
                <div style={{
                  fontSize: '6.5pt',
                  color: '#9CA3AF',
                  fontStyle: 'italic',
                  fontFamily: 'Arial, sans-serif',
                }}>For external use only</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LabelsClient;
