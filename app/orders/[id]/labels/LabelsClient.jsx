'use client';

import React, { useState } from 'react';
import { Printer, Truck, CheckSquare, Square } from 'lucide-react';
import { formatPhoneForDisplay } from '@/lib/utils/phone';

const COLORS = {
  brand: '#1B4332',
  text: '#000000',
  muted: '#4B5563',
};

const FONTS = {
  sans: '"Plus Jakarta Sans", "Inter", Arial, sans-serif',
};

const LabelsClient = ({ orderInfo, businessConfig }) => {
  const [selectedIds, setSelectedIds] = useState(new Set([-1, -2]));

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
        
        .address-label {
          background: white; border: 1px dashed #000; padding: 8mm;
          display: flex; flex-direction: column; cursor: pointer; position: relative; box-sizing: border-box;
        }

        .addr-tag {
          display: inline-block; background: #1B4332; color: #ffffff !important;
          font-weight: 800; letter-spacing: 0.18em; border-radius: 4px;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }

        .selection-overlay { position: absolute; top: 2px; right: 2px; z-index: 10; background: white; border-radius: 4px; }
        .deselected { opacity: 0.2 !important; }

        @media print {
          .no-print { display: none !important; }
          .labels-page { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .deselected { display: none !important; }
          
          .shipping-section { display: flex; flex-wrap: wrap; gap: 5mm; border-top: 0.2mm solid #000; paddingTop: 6mm; page-break-inside: avoid; }
          .address-label { border: 0.3mm dashed #000 !important; box-sizing: border-box !important; padding: 8mm !important; }
          .to-label { width: 115mm !important; height: auto !important; }
          .from-label { width: 95mm !important; height: auto !important; }
          
          * { color: #000000 !important; border-color: #000000 !important; }
          .address-label div { background: none !important; }
          .addr-tag { background: #1B4332 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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
            {/* Brand row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm', marginBottom: '6px' }}>
              <img src="/logo/healing-soil-v2.1.png" style={{ width: '13mm', height: 'auto' }} />
              <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.brand, letterSpacing: '0.04em' }}>{businessConfig.brand.name}</div>
            </div>
            {/* TO heading with rule */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 12px 0' }}>
              <span className="addr-tag" style={{ fontSize: '22px', padding: '3px 16px' }}>TO</span>
              <div style={{ flex: 1, borderTop: '2.5px solid black' }} />
            </div>
            {/* Recipient */}
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'black', marginBottom: '6px', lineHeight: 1.05 }}>{orderInfo.customer_name}</div>
            <div style={{ fontSize: '15px', lineHeight: 1.5, color: 'black', fontWeight: 500, marginBottom: '10px' }}>
              {orderInfo.customer_address}
            </div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'black' }}>
              Phone: {formatPhoneForDisplay(orderInfo.customer_phone)}
            </div>
          </div>

          {/* FROM LABEL */}
          <div className={`address-label from-label ${selectedIds.has(-2) ? '' : 'deselected'}`}
               style={{ width: '95mm', padding: '7mm', boxSizing: 'border-box' }}
               onClick={() => toggleLabel(-2)}>
            <div className="selection-overlay no-print">
              {selectedIds.has(-2) ? <CheckSquare size={20} fill={COLORS.brand} color="white" /> : <Square size={20} color={COLORS.muted} />}
            </div>
            {/* Brand row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm', marginBottom: '6px' }}>
              <img src="/logo/healing-soil-v2.1.png" style={{ width: '12mm', height: 'auto' }} />
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.brand, letterSpacing: '0.04em' }}>{businessConfig.brand.name}</div>
            </div>
            {/* FROM heading with rule */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 10px 0' }}>
              <span className="addr-tag" style={{ fontSize: '18px', padding: '3px 14px' }}>FROM</span>
              <div style={{ flex: 1, borderTop: '2.5px solid black' }} />
            </div>
            {/* Sender */}
            <div style={{ fontSize: '21px', fontWeight: 800, color: 'black', lineHeight: 1.1 }}>{businessConfig.returnAddress.name}</div>
            <div style={{ fontSize: '15px', lineHeight: 1.45, color: 'black', marginTop: '6px', fontWeight: 500 }}>
              {businessConfig.returnAddress.line1}<br />
              {businessConfig.returnAddress.line2}<br />
              {businessConfig.returnAddress.line3}<br />
              {businessConfig.returnAddress.cityStateZip}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '10px', color: 'black' }}>
              Phone: {businessConfig.returnAddress.phone}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LabelsClient;
