'use client';

import React, { useState } from 'react';
import { Printer, Truck, Tag, CheckSquare, Square } from 'lucide-react';
import businessConfig from '@/lib/config/business.json';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

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
        
        @page { size: A4; margin: 12mm 8mm; }
        .labels-page { background: #F0EDE8; padding: 20px; min-height: 100vh; font-family: ${FONTS.sans}; }
        .section-header { color: ${COLORS.brand}; margin: 20px 0 10px 0; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }
        
        .product-label {
          width: 60mm; height: 40mm; border: 1px dashed #CCC;
          display: flex; flex-direction: column; position: relative;
          cursor: pointer; transition: opacity 0.2s; box-sizing: border-box; overflow: hidden;
          background-image: url('/label-bg.png'); background-size: cover; background-position: center;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }

        .address-label {
          background: white; border: 1px dashed #000; padding: 8mm;
          display: flex; flex-direction: column; cursor: pointer; position: relative; box-sizing: border-box;
        }

        .selection-overlay { position: absolute; top: 2px; right: 2px; z-index: 10; background: white; border-radius: 4px; }
        .deselected { opacity: 0.2 !important; }

        @media print {
          .no-print { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .deselected { display: none !important; }
          
          .product-grid { display: grid; grid-template-columns: repeat(3, 60mm); gap: 4mm; margin-bottom: 6mm; padding-top: 2mm; }
          .product-label { width: 60mm !important; height: 40mm !important; border: 0.3mm dashed #000 !important; page-break-inside: avoid !important; box-sizing: border-box !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          .shipping-section { display: flex; flex-wrap: wrap; gap: 5mm; border-top: 0.2mm solid #000; paddingTop: 6mm; page-break-inside: avoid; }
          .address-label { border: 0.3mm dashed #000 !important; box-sizing: border-box !important; padding: 8mm !important; }
          .to-label { width: 115mm !important; height: auto !important; }
          .from-label { width: 75mm !important; height: auto !important; }
          
          * { color: #000000 !important; border-color: #000000 !important; }
          .address-label div { background: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: COLORS.brand, color: 'white', padding: '16px', borderRadius: '12px', marginBottom: '20px', maxWidth: '800px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Print Center</h2>
          <p style={{ margin: '2px 0 0 0', opacity: 0.8, fontSize: '12px' }}>Order #{orderInfo.id.slice(0,8)}</p>
        </div>
        <button onClick={() => window.print()} style={{ background: 'white', color: COLORS.brand, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Printer size={18} /> Print Now ({selectedIds.size})
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Product Labels Section */}
        <h3 className="section-header no-print"><Tag size={18} /> Product Labels</h3>
        <div className="product-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {labels.map((label, index) => (
            <div key={index} className={`product-label ${selectedIds.has(index) ? '' : 'deselected'}`} onClick={() => toggleLabel(index)}>
              {/* Background overlay for text readability */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.45)', zIndex: 0, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />

              <div className="selection-overlay no-print" style={{ zIndex: 20 }}>
                {selectedIds.has(index) ? <CheckSquare size={16} fill={COLORS.brand} color="white" /> : <Square size={16} color={COLORS.muted} />}
              </div>

              {/* Content layer */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '2mm 3mm' }}>
                {/* Logo centered */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1mm' }}>
                  <img src="/logo/healing-soil-v2.1.png" style={{ width: '14mm', height: 'auto' }} />
                  <div style={{ fontSize: '5pt', fontWeight: 700, color: COLORS.brand, letterSpacing: '0.08em', marginTop: '0.3mm' }}>{businessConfig.brand.name}</div>
                </div>

                {/* Product name */}
                <div style={{ textAlign: 'center', fontSize: '11pt', fontWeight: 800, color: COLORS.brand, lineHeight: 1.1, marginBottom: '1mm' }}>
                  {label.product_name}
                </div>

                {/* Ingredients */}
                <div style={{ fontSize: '7pt', color: COLORS.text, lineHeight: 1.3, flex: 1, overflow: 'hidden', fontWeight: 500 }}>
                  <span style={{ fontWeight: 800 }}>Ingredients : </span>{getFullIngredients(label.base_type, label.ingredients)}
                </div>

                {/* Bottom row: Udyam left, Weight + Expiry right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5mm' }}>
                  <div style={{ fontSize: '5pt', fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>
                    {businessConfig.brand.license}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2mm' }}>
                    <div style={{ fontSize: '5.5pt', fontWeight: 700, color: COLORS.text, background: 'rgba(255,255,255,0.7)', padding: '0.3mm 1mm', borderRadius: '1mm' }}>
                      Wt: {label.weight_grams}g
                    </div>
                    <div style={{ fontSize: '5.5pt', fontWeight: 700, color: COLORS.text, background: 'rgba(255,255,255,0.7)', padding: '0.3mm 1mm', borderRadius: '1mm' }}>
                      Expiry: {formatBBE(label.order_date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping Section */}
        <h3 className="section-header no-print"><Truck size={18} /> Shipping Labels</h3>
        <div className="shipping-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* TO LABEL */}
          <div className={`address-label to-label ${selectedIds.has(-1) ? '' : 'deselected'}`}
               style={{ width: '115mm', padding: '8mm', boxSizing: 'border-box' }}
               onClick={() => toggleLabel(-1)}>
            <div className="selection-overlay no-print">
              {selectedIds.has(-1) ? <CheckSquare size={20} fill={COLORS.brand} color="white" /> : <Square size={20} color={COLORS.muted} />}
            </div>
            {/* Big TO banner */}
            <div style={{ border: '2.5px solid black', color: 'black', fontSize: '30px', fontWeight: 800, letterSpacing: '0.18em', textAlign: 'center', padding: '6px 0', borderRadius: '4px', marginBottom: '10px' }}>
              TO
            </div>
            {/* Brand row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', paddingBottom: '4px' }}>
              <img src="/logo/healing-soil-v2.1.png" style={{ width: '18mm', height: 'auto' }} />
              <div style={{ fontSize: '14px', fontWeight: 800, color: COLORS.brand }}>{businessConfig.brand.name}</div>
            </div>
            <div style={{ marginBottom: '10px' }}><WavyDivider color="black" opacity={0.6} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'black', marginBottom: '6px', lineHeight: 1 }}>{orderInfo.customer_name}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'black', fontWeight: 500, marginBottom: '8px' }}>
                {orderInfo.customer_address}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'black' }}>
                PH: {formatPhoneForDisplay(orderInfo.customer_phone)}
              </div>
            </div>
          </div>

          {/* FROM LABEL */}
          <div className={`address-label from-label ${selectedIds.has(-2) ? '' : 'deselected'}`} 
               style={{ width: '75mm', padding: '5mm', boxSizing: 'border-box' }}
               onClick={() => toggleLabel(-2)}>
            <div className="selection-overlay no-print">
              {selectedIds.has(-2) ? <CheckSquare size={18} fill={COLORS.brand} color="white" /> : <Square size size={18} color={COLORS.muted} />}
            </div>
            {/* FROM banner */}
            <div style={{ border: '1.5px solid black', color: 'black', fontSize: '20px', fontWeight: 800, letterSpacing: '0.16em', textAlign: 'center', padding: '3px 0', borderRadius: '3px', marginBottom: '8px' }}>
              FROM
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', paddingBottom: '3px' }}>
              <img src="/logo/healing-soil-v2.1.png" style={{ width: '11mm', height: 'auto' }} />
              <div style={{ fontSize: '10px', fontWeight: 800, color: COLORS.brand }}>{businessConfig.brand.name}</div>
            </div>
            <div style={{ marginBottom: '6px' }}><WavyDivider color="black" opacity={0.6} /></div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'black', lineHeight: 1.1 }}>{businessConfig.returnAddress.name}</div>
            <div style={{ fontSize: '13px', lineHeight: 1.3, color: 'black', marginTop: '4px', fontWeight: 500 }}>
              {businessConfig.returnAddress.line1}<br />
              {businessConfig.returnAddress.line2}<br />
              {businessConfig.returnAddress.line3}<br />
              {businessConfig.returnAddress.cityStateZip}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, marginTop: 'auto', color: 'black' }}>
              M: {businessConfig.returnAddress.phone}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LabelsClient;
