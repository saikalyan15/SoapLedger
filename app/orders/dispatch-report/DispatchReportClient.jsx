'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Printer, Truck, CheckSquare, Square, ListChecks, ListX } from 'lucide-react';
import { formatPhoneForDisplay } from '@/lib/utils/phone';
import StatusBadge from '@/components/StatusBadge';

const COLORS = {
  brand: '#1B4332',
  text: '#000000',
  muted: '#4B5563',
};

const FONTS = {
  sans: '"Plus Jakarta Sans", "Inter", Arial, sans-serif',
};

const DispatchReportClient = ({ shipments, businessConfig }) => {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(shipments.map((s) => s.shipment_id))
  );

  const toggle = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => setSelectedIds(new Set(shipments.map((s) => s.shipment_id)));
  const deselectAll = () => setSelectedIds(new Set());

  const selectedCount = selectedIds.size;

  return (
    <div className="dispatch-report-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @page { size: A4; margin: 12mm 8mm; }
        .dispatch-report-page { background: #F0EDE8; padding: 20px; min-height: 100vh; font-family: ${FONTS.sans}; }
        .section-header { color: ${COLORS.brand}; margin: 20px 0 10px 0; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; }

        .address-label {
          background: white; border: 1px dashed #000; padding: 8mm; width: 115mm;
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
          .dispatch-report-page { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .deselected { display: none !important; }

          .shipping-section { display: flex; flex-wrap: wrap; gap: 5mm; page-break-inside: avoid; }
          .address-label { border: 0.3mm dashed #000 !important; box-sizing: border-box !important; padding: 8mm !important; width: 115mm !important; height: auto !important; page-break-inside: avoid; }

          * { color: #000000 !important; border-color: #000000 !important; }
          .address-label div { background: none !important; }
          .addr-tag { background: #1B4332 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          background: COLORS.brand, color: 'white', padding: '16px', borderRadius: '12px',
          marginBottom: '20px', maxWidth: '1000px', margin: '0 auto 20px auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Dispatch Report</h2>
          <p style={{ margin: '2px 0 0 0', opacity: 0.8, fontSize: '12px' }}>
            {shipments.length} shipment{shipments.length === 1 ? '' : 's'} awaiting dispatch
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={selectAll}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ListChecks size={16} /> Select All
          </button>
          <button
            onClick={deselectAll}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ListX size={16} /> Deselect All
          </button>
          <button
            onClick={() => window.print()}
            disabled={selectedCount === 0}
            style={{ background: 'white', color: COLORS.brand, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: selectedCount === 0 ? 'not-allowed' : 'pointer', opacity: selectedCount === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            <Printer size={18} /> Print ({selectedCount})
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h3 className="section-header no-print"><Truck size={18} /> Addresses to Dispatch</h3>

        {shipments.length === 0 ? (
          <div className="no-print" style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            Nothing pending — every order has been dispatched.
          </div>
        ) : (
          <div className="shipping-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
            {shipments.map((s) => {
              const isSelected = selectedIds.has(s.shipment_id);
              const formattedDate = new Date(s.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div
                  key={s.shipment_id}
                  className={`address-label ${isSelected ? '' : 'deselected'}`}
                  onClick={() => toggle(s.shipment_id)}
                >
                  <div className="selection-overlay no-print">
                    {isSelected ? <CheckSquare size={20} fill={COLORS.brand} color="white" /> : <Square size={20} color={COLORS.muted} />}
                  </div>

                  {/* Order meta — screen only */}
                  <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Link
                      href={`/orders/${s.order_id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '11px', fontWeight: 700, color: COLORS.brand, textDecoration: 'none' }}
                    >
                      #{s.order_id.slice(0, 8)} · {formattedDate}
                    </Link>
                    <StatusBadge status={s.order_status} short />
                  </div>

                  {/* Brand row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm', marginBottom: '6px' }}>
                    <img src="/logo/healing-soil-v2.1.png" style={{ width: '13mm', height: 'auto' }} alt="" />
                    <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.brand, letterSpacing: '0.04em' }}>{businessConfig.brand.name}</div>
                  </div>
                  {/* TO heading with rule */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 12px 0' }}>
                    <span className="addr-tag" style={{ fontSize: '22px', padding: '3px 16px' }}>TO</span>
                    <div style={{ flex: 1, borderTop: '2.5px solid black' }} />
                  </div>
                  {/* Recipient */}
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'black', marginBottom: '6px', lineHeight: 1.05 }}>{s.customer_name}</div>
                  <div style={{ fontSize: '15px', lineHeight: 1.5, color: 'black', fontWeight: 500, marginBottom: '10px' }}>
                    {s.address_text}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: 'black' }}>
                    Phone: {formatPhoneForDisplay(s.customer_phone)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchReportClient;
