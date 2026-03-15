'use client';

import React, { useState } from 'react';
import { Printer, Truck, Tag, CheckSquare, Square } from 'lucide-react';
import businessConfig from '@/lib/config/business.json';

const BASE_LABELS = {
  'Glycerine':   'Glycerine',
  'Goat Milk':   'Goat Milk',
  'Shea Butter': 'Shea Butter',
  'Red Wine':    'Red Wine',
  'Loofah':      'Loofah',
  'Travel':      '',
};

// Standardized Colors and Weights
const COLORS = {
  brand: '#1B4332',    // Deep Green
  text: '#1F2937',     // Dark Charcoal
  muted: '#6B7280',    // Grey
  border: '#E5E7EB',
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

const LabelsClient = ({ labels, orderInfo }) => {
  const [selectedIds, setSelectedIds] = useState(new Set([...labels.map((_, i) => i), -1, -2]));

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        @page { size: A4; margin: 10mm; }
        .labels-page { background: #F0EDE8; padding: 20px; min-height: 100vh; font-family: ${FONTS.sans}; }
        .section-header { color: ${COLORS.brand}; margin: 30px 0 15px 0; display: flex; align-items: center; gap: 10px; font-weight: 700; }
        
        .product-label {
          width: 60mm; height: 40mm; background: white; border: 1px dashed #CCC;
          padding: 3mm; display: flex; flex-direction: column; position: relative;
          cursor: pointer; transition: opacity 0.2s; box-sizing: border-box;
        }
        
        .address-label {
          background: white; border: 2px solid ${COLORS.brand}; padding: 8mm; 
          display: flex; flex-direction: column; cursor: pointer; position: relative; box-sizing: border-box;
        }

        .selection-overlay { position: absolute; top: 2px; right: 2px; z-index: 10; background: white; border-radius: 4px; }
        .deselected { opacity: 0.3 !important; }

        @media print {
          .no-print { display: none !important; }
          .labels-page { background: white; padding: 0; }
          .deselected { display: none !important; }
          
          .product-grid { display: grid; grid-template-columns: repeat(3, 60mm); gap: 5mm; page-break-after: always; }
          .product-label { width: 60mm !important; height: 40mm !important; border: 0.1mm solid #EEE; }
          .shipping-section { page-break-before: always; padding-top: 20px; display: flex; flex-direction: column; gap: 10mm; }
          .address-label { border: 0.5mm solid black; }
          .to-label { width: 140mm !important; height: 90mm !important; }
          .from-label { width: 100mm !important; height: 60mm !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: COLORS.brand, color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px', maxWidth: '800px', margin: '0 auto 30px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800 }}>Print Center</h2>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '14px' }}>Order #{orderInfo.id.slice(0,8)} | {orderInfo.customer_name}</p>
          </div>
          <button onClick={() => window.print()} style={{ background: 'white', color: COLORS.brand, border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={20} /> Print Selected ({selectedIds.size})
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Product Labels Section */}
        <h3 className="section-header no-print"><Tag size={20} /> Product Labels (40mm x 60mm)</h3>
        <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {labels.map((label, index) => (
            <div key={index} className={`product-label ${selectedIds.has(index) ? '' : 'deselected'}`} onClick={() => toggleLabel(index)}>
              <div className="selection-overlay no-print">
                {selectedIds.has(index) ? <CheckSquare size={18} fill={COLORS.brand} color="white" /> : <Square size={18} color={COLORS.muted} />}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginBottom: '1mm' }}>
                <img src="/HealingSoil-Formatted.png" style={{ width: '6mm', height: '6mm', borderRadius: '50%' }} />
                <div style={{ fontSize: '7pt', fontWeight: 800, color: COLORS.brand, letterSpacing: '0.05em' }}>{businessConfig.brand.name}</div>
              </div>
              
              <div style={{ textAlign: 'center', fontSize: '11pt', fontWeight: 800, color: COLORS.brand, lineHeight: 1.1, margin: '1mm 0' }}>
                {label.product_name}
              </div>

              <WavyDivider opacity={0.3} />

              <div style={{ fontSize: '7.5pt', color: COLORS.text, lineHeight: 1.3, flex: 1, overflow: 'hidden', padding: '0.5mm 0', fontWeight: 500 }}>
                <span style={{ fontWeight: 700 }}>Ingredients:</span> {getFullIngredients(label.base_type, label.ingredients)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.5pt', color: COLORS.muted, borderTop: '0.1mm solid #EEE', paddingTop: '1.5mm', marginTop: '1mm', fontWeight: 700 }}>
                <span>Wt: {label.weight_grams}g</span>
                <span>Exp: {formatBBE(label.order_date)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping Section */}
        <h3 className="section-header no-print"><Truck size={20} /> Shipping Labels</h3>
        <div className="shipping-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* TO LABEL */}
          <div className={`address-label to-label ${selectedIds.has(-1) ? '' : 'deselected'}`} 
               style={{ width: '140mm', minHeight: '90mm' }}
               onClick={() => toggleLabel(-1)}>
            <div className="selection-overlay no-print">
              {selectedIds.has(-1) ? <CheckSquare size={24} fill={COLORS.brand} color="white" /> : <Square size={24} color={COLORS.muted} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', borderBottom: '2px solid black', paddingBottom: '8px', marginBottom: '20px' }}>
              <img src="/HealingSoil-Formatted.png" style={{ width: '10mm', height: '10mm', borderRadius: '50%' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.brand, letterSpacing: '0.05em' }}>{businessConfig.brand.name} — TO</div>
            </div>
            <div style={{ fontSize: '14px', color: COLORS.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '5px' }}>Ship To:</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'black', marginBottom: '15px' }}>{orderInfo.customer_name}</div>
            <div style={{ fontSize: '20px', lineHeight: 1.5, color: 'black', fontWeight: 500, maxWidth: '90%' }}>
              {orderInfo.customer_address}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: 'auto', background: '#F3F4F6', padding: '12px 20px', borderRadius: '8px', alignSelf: 'flex-start', color: 'black' }}>
              PHONE: {orderInfo.customer_phone}
            </div>
          </div>

          {/* FROM LABEL */}
          <div className={`address-label from-label ${selectedIds.has(-2) ? '' : 'deselected'}`} 
               style={{ width: '100mm', minHeight: '60mm' }}
               onClick={() => toggleLabel(-2)}>
            <div className="selection-overlay no-print">
              {selectedIds.has(-2) ? <CheckSquare size={20} fill={COLORS.brand} color="white" /> : <Square size={20} color={COLORS.muted} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', borderBottom: '1px solid #CCC', paddingBottom: '5px', marginBottom: '15px' }}>
              <img src="/HealingSoil-Formatted.png" style={{ width: '8mm', height: '8mm', borderRadius: '50%' }} />
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.muted, letterSpacing: '0.05em' }}>{businessConfig.brand.name} — FROM</div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'black' }}>{businessConfig.returnAddress.name}</div>
            <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'black', marginTop: '5px', fontWeight: 500 }}>
              {businessConfig.returnAddress.line1}<br />
              {businessConfig.returnAddress.line2}<br />
              {businessConfig.returnAddress.line3}<br />
              {businessConfig.returnAddress.cityStateZip}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '10px', color: 'black' }}>
              M: {businessConfig.returnAddress.phone}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LabelsClient;
