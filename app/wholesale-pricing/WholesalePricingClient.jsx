'use client';

import { useMemo, useState } from 'react';

const STANDARD_TIERS = [
  { qty: 50, discount: 0.25 },
  { qty: 100, discount: 0.30 },
  { qty: 150, discount: 0.35 },
];

const BULK_TIERS = [
  { qty: 50, discount: 0.30 },
  { qty: 100, discount: 0.35 },
  { qty: 150, discount: 0.40 },
];

const TABS = [
  { id: 'quote', label: 'Quotation Builder' },
  { id: 'standard', label: 'Standard Wholesale' },
  { id: 'mixed', label: 'Mixed Assortment' },
  { id: 'bulk', label: 'Bulk / Unlabelled' },
  { id: 'private', label: 'Private Label' },
  { id: 'custom', label: 'Custom / Event' },
];

const PRICING_COMBINATIONS = {
  quote: {
    title: 'Quotation Builder',
    formula: 'Uses the selected pricing combination below, then calculates line total = quoted unit price x quantity.',
    rationale: 'Use this when an enquiry arrives and you need a clean PDF-ready quote instead of sending the full price grid.',
  },
  standard: {
    title: 'Standard Wholesale',
    formula: 'Per SKU: retail x 75% at MOQ 50, retail x 70% at MOQ 100, retail x 65% at MOQ 150. Unit prices round to nearest ₹5.',
    rationale: 'Best for single-variety wholesale because each product must independently meet the MOQ, keeping batching and inventory planning simple.',
  },
  mixed: {
    title: 'Mixed Assortment',
    formula: 'Same unit discounts as standard wholesale, but MOQ is met by total units across products.',
    rationale: 'Best for retailers who want variety. It supports discovery orders while still protecting production volume.',
  },
  bulk: {
    title: 'Bulk / Unlabelled',
    formula: 'Retail x 70% at MOQ 50, retail x 65% at MOQ 100, retail x 60% at MOQ 150. Unit prices round to nearest ₹5.',
    rationale: 'Best when soaps do not need retail labels or custom packaging. Lower finishing effort allows a deeper discount.',
  },
  private: {
    title: 'Private Label',
    formula: 'Quote-based: product wholesale base + sleeve/box/artwork/setup + any formula or fragrance change cost.',
    rationale: 'Packaging runs, artwork proofing, sleeves, boxes, stamping, and formula changes can vary widely, so exact pricing should not be automated from retail alone.',
  },
  custom: {
    title: 'Custom / Event',
    formula: 'Standard wholesale base + event-specific add-ons such as tags, ribbons, boxes, inserts, stamps, fragrance, or rush work.',
    rationale: 'Best for weddings, corporate gifting, hotels, and seasonal orders where presentation and deadline affect labour and material cost.',
  },
};

const QUOTE_MODE_LABELS = {
  standard: 'Standard Wholesale',
  mixed: 'Mixed Assortment',
  bulk: 'Bulk / Unlabelled',
  custom: 'Custom / Event',
};

const BASE_COLOURS = {
  Glycerine: '#1B4332',
  'Goat Milk': '#2D6A4F',
  'Shea Butter': '#40916C',
  Loofah: '#52B788',
  Mixed: '#7C3AED',
  'Papaya Cucumber': '#B45309',
  'Red Wine': '#9F1239',
  Travel: '#0E7490',
  Other: '#6B7280',
};

const th = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
  background: '#F9FAFB',
};

const thRight = { ...th, textAlign: 'right' };

const td = {
  padding: '11px 12px',
  fontSize: '13px',
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
};

const tdRight = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCurrency = (n) => `₹${fmt(Math.round(Number(n || 0)))}`;
const roundToNearestFive = (value) => Math.round(Number(value || 0) / 5) * 5;
const todayIso = () => new Date().toISOString().slice(0, 10);
const futureIso = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

function getApplicableTier(quantity, tiers) {
  return [...tiers].reverse().find((tier) => quantity >= tier.qty) || null;
}

function getQuoteUnitPrice(product, mode, lineQuantity, totalQuantity) {
  const retailPrice = Number(product?.unit_price || 0);
  const tiers = mode === 'bulk' ? BULK_TIERS : STANDARD_TIERS;
  const basisQuantity = mode === 'mixed' || mode === 'bulk' ? totalQuantity : lineQuantity;
  const tier = getApplicableTier(basisQuantity, tiers);

  if (!tier) {
    return {
      unitPrice: retailPrice,
      discount: 0,
      tierLabel: 'Below MOQ',
    };
  }

  return {
    unitPrice: roundToNearestFive(retailPrice * (1 - tier.discount)),
    discount: tier.discount,
    tierLabel: `MOQ ${tier.qty}`,
  };
}

function TypeBadge({ type }) {
  const color = BASE_COLOURS[type] || BASE_COLOURS.Other;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 700,
      background: `${color}18`,
      color,
      border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

function StatusPill({ product }) {
  const active = product.is_active && product.in_stock;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 700,
      color: active ? '#047857' : '#9CA3AF',
      background: active ? '#ECFDF5' : '#F3F4F6',
      border: active ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function PriceCell({ retailPrice, tier }) {
  const unitPrice = roundToNearestFive(retailPrice * (1 - tier.discount));
  const total = unitPrice * tier.qty;

  return (
    <td style={tdRight}>
      <div style={{ fontWeight: 700, color: '#111827' }}>{fmtCurrency(unitPrice)}</div>
      <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>
        {fmtCurrency(total)} total
      </div>
    </td>
  );
}

function ScrollFrame({ children }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: 700 }}>
        Scroll horizontally to see all columns
      </div>
      <div
        style={{
          overflowX: 'scroll',
          overflowY: 'hidden',
          maxWidth: '100%',
          paddingBottom: '10px',
          scrollbarColor: '#9CA3AF #F3F4F6',
          scrollbarWidth: 'thin',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PricingGuidance({ mode, compact = false }) {
  const guidance = PRICING_COMBINATIONS[mode] || PRICING_COMBINATIONS.standard;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '10px',
      marginBottom: compact ? '14px' : '18px',
    }}>
      <div style={{ border: '1px solid #D1FAE5', borderRadius: '8px', background: '#F0FDF4', padding: '12px 14px' }}>
        <div style={{ fontSize: '11px', color: '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{guidance.title}</div>
        <div style={{ fontSize: '13px', color: '#064E3B', lineHeight: 1.5, marginTop: '4px' }}>{guidance.formula}</div>
      </div>
      <div style={{ border: '1px solid #FDE68A', borderRadius: '8px', background: '#FFFBEB', padding: '12px 14px' }}>
        <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rationale</div>
        <div style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.5, marginTop: '4px' }}>{guidance.rationale}</div>
      </div>
    </div>
  );
}

function PricingTable({ products, tiers, mode }) {
  return (
    <ScrollFrame>
      <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <thead>
          <tr>
            <th style={th}>Product</th>
            <th style={th}>Type</th>
            <th style={thRight}>Weight</th>
            <th style={th}>Status</th>
            <th style={thRight}>Retail</th>
            {tiers.map((tier) => (
              <th key={tier.qty} style={thRight}>
                MOQ {tier.qty}
                <span style={{ display: 'block', fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                  {Math.round(tier.discount * 100)}% off
                </span>
              </th>
            ))}
            <th style={th}>Rationale</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const retailPrice = Number(product.unit_price || 0);
            const muted = !product.is_active;
            return (
              <tr key={product.id} style={{ background: muted ? '#FAFAFA' : '#FFFFFF' }}>
                <td style={{ ...td, minWidth: '230px', fontWeight: 700, color: muted ? '#9CA3AF' : '#111827', whiteSpace: 'normal' }}>
                  {product.name}
                </td>
                <td style={td}><TypeBadge type={product.base_type || 'Other'} /></td>
                <td style={tdRight}>{product.weight_grams ? `${product.weight_grams}g` : 'Set'}</td>
                <td style={td}><StatusPill product={product} /></td>
                <td style={{ ...tdRight, fontWeight: 700 }}>{fmtCurrency(retailPrice)}</td>
                {tiers.map((tier) => (
                  <PriceCell key={tier.qty} retailPrice={retailPrice} tier={tier} />
                ))}
                <td style={{ ...td, minWidth: '240px', whiteSpace: 'normal', color: '#4B5563', lineHeight: 1.45 }}>
                  {mode === 'bulk'
                    ? 'Lower packaging and labelling effort allows a deeper discount.'
                    : 'Retail-anchored wholesale rate with stronger discount at larger production quantities.'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollFrame>
  );
}

function SummaryCard({ label, value, note }) {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px 16px', background: '#FFFFFF' }}>
      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '24px', color: '#111827', fontWeight: 800, marginTop: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px', lineHeight: 1.4 }}>{note}</div>
    </div>
  );
}

function GuidanceTable({ rows }) {
  return (
    <ScrollFrame>
      <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <thead>
          <tr>
            <th style={th}>Combination</th>
            <th style={th}>Indicative MOQ</th>
            <th style={th}>Pricing Basis</th>
            <th style={th}>Use When</th>
            <th style={th}>Rationale</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.combination}>
              <td style={{ ...td, fontWeight: 700, color: '#111827', whiteSpace: 'normal' }}>{row.combination}</td>
              <td style={td}>{row.moq}</td>
              <td style={{ ...td, whiteSpace: 'normal' }}>{row.pricing}</td>
              <td style={{ ...td, whiteSpace: 'normal' }}>{row.use}</td>
              <td style={{ ...td, whiteSpace: 'normal', minWidth: '260px', lineHeight: 1.45 }}>{row.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollFrame>
  );
}

function inputStyle() {
  return {
    width: '100%',
    minHeight: '40px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    padding: '8px 10px',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '13px',
    color: '#111827',
    background: '#FFFFFF',
  };
}

function labelStyle() {
  return {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#4B5563',
    marginBottom: '6px',
  };
}

function QuotationBuilder({ products }) {
  const activeProducts = products.filter((product) => product.is_active && product.in_stock);
  const productById = useMemo(() => {
    const map = {};
    for (const product of products) map[product.id] = product;
    return map;
  }, [products]);

  const [quoteMode, setQuoteMode] = useState('mixed');
  const [customerName, setCustomerName] = useState('');
  const [quoteDate, setQuoteDate] = useState(todayIso);
  const [validUntil, setValidUntil] = useState(() => futureIso(7));
  const [notes, setNotes] = useState('Prices are exclusive of shipping and any custom packaging, sleeve, stamp, or gift-box setup.');
  const [items, setItems] = useState(() => activeProducts.slice(0, 1).map((product) => ({
    id: crypto.randomUUID(),
    productId: product.id,
    quantity: 50,
  })));

  const addLine = () => {
    const firstProduct = activeProducts[0];
    if (!firstProduct) return;
    setItems((current) => [...current, {
      id: crypto.randomUUID(),
      productId: firstProduct.id,
      quantity: 50,
    }]);
  };

  const updateLine = (id, field, value) => {
    setItems((current) => current.map((item) => (
      item.id === id
        ? { ...item, [field]: field === 'quantity' ? Math.max(0, Number(value || 0)) : value }
        : item
    )));
  };

  const removeLine = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const loadAllVarietiesPreset = () => {
    setQuoteMode('mixed');
    setItems(activeProducts.map((product) => ({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 50,
    })));
  };

  const loadGlycerinePreset = () => {
    setQuoteMode('mixed');
    const selected = activeProducts.filter((product) => (
      ['Neem Tulsi Glycerin Soap', 'Honey Oats Glycerin Soap'].includes(product.name)
    ));
    setItems(selected.map((product) => ({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 100,
    })));
  };

  const quoteLines = items
    .map((item) => ({ ...item, product: productById[item.productId] }))
    .filter((item) => item.product && item.quantity > 0);
  const totalQuantity = quoteLines.reduce((sum, item) => sum + item.quantity, 0);
  const pricedLines = quoteLines.map((item) => {
    const price = getQuoteUnitPrice(item.product, quoteMode, item.quantity, totalQuantity);
    return {
      ...item,
      ...price,
      lineTotal: price.unitPrice * item.quantity,
    };
  });
  const quoteTotal = pricedLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const quoteModeLabel = QUOTE_MODE_LABELS[quoteMode];
  const belowMoq = pricedLines.some((item) => item.discount === 0);

  return (
    <div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .quotation-print-area,
          .quotation-print-area * {
            visibility: visible !important;
          }
          .quotation-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            padding: 22mm !important;
            background: #ffffff !important;
          }
          .quotation-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="quotation-no-print" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(300px, 0.9fr)', gap: '18px', alignItems: 'start', marginBottom: '22px' }}>
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FFFFFF', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Create quotation</h2>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Build an enquiry quote, then print or save as PDF.</p>
            </div>
            <button
              onClick={() => window.print()}
              disabled={pricedLines.length === 0}
              style={{
                minHeight: '40px',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 14px',
                background: pricedLines.length ? '#1B4332' : '#9CA3AF',
                color: '#FFFFFF',
                fontWeight: 800,
                cursor: pricedLines.length ? 'pointer' : 'not-allowed',
              }}
            >
              Print / Save PDF
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle()}>Enquiry / Customer</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Quote Date</label>
              <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Valid Until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Pricing Combination</label>
              <select value={quoteMode} onChange={(e) => setQuoteMode(e.target.value)} style={inputStyle()}>
                <option value="standard">Standard Wholesale</option>
                <option value="mixed">Mixed Assortment</option>
                <option value="bulk">Bulk / Unlabelled</option>
                <option value="custom">Custom / Event</option>
              </select>
            </div>
          </div>

          <PricingGuidance mode={quoteMode} compact />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button onClick={loadAllVarietiesPreset} style={{ minHeight: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 11px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
              All active varieties x 50
            </button>
            <button onClick={loadGlycerinePreset} style={{ minHeight: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 11px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
              Neem Tulsi + Honey Oats x 100
            </button>
            <button onClick={addLine} style={{ minHeight: '36px', border: '1px solid #1B4332', borderRadius: '6px', padding: '7px 11px', background: '#F0FDF4', color: '#1B4332', fontWeight: 800, cursor: 'pointer' }}>
              Add product
            </button>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 110px 44px', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle()}>Product</label>
                  <select value={item.productId} onChange={(e) => updateLine(item.id, 'productId', e.target.value)} style={inputStyle()}>
                    {activeProducts.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle()}>Qty</label>
                  <input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateLine(item.id, 'quantity', e.target.value)} style={inputStyle()} />
                </div>
                <button onClick={() => removeLine(item.id)} style={{ minHeight: '40px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#991B1B', fontWeight: 800, cursor: 'pointer' }}>
                  x
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={labelStyle()}>Quote Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.45 }} />
          </div>
        </div>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FFFFFF', padding: '16px' }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: '#1B4332', marginBottom: '10px' }}>Quote summary</h3>
          <SummaryCard label="Total Quantity" value={fmt(totalQuantity)} note={quoteMode === 'standard' ? 'Tier applied per product line' : 'Tier applied by total quote quantity'} />
          <div style={{ height: '10px' }} />
          <SummaryCard label="Quote Total" value={fmtCurrency(quoteTotal)} note={`${quoteModeLabel || 'Wholesale'} pricing`} />
          {belowMoq && (
            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', color: '#991B1B', fontSize: '12px', lineHeight: 1.45 }}>
              One or more lines are below MOQ 50, so retail price is shown for those lines.
            </div>
          )}
        </div>
      </div>

      <div className="quotation-print-area" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', borderBottom: '2px solid #1B4332', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', color: '#1B4332', fontSize: '32px', lineHeight: 1 }}>Healing Soil</div>
            <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>Handmade soap wholesale quotation</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#374151', lineHeight: 1.7 }}>
            <div><strong>Quote date:</strong> {quoteDate || '-'}</div>
            <div><strong>Valid until:</strong> {validUntil || '-'}</div>
            <div><strong>Pricing:</strong> {quoteModeLabel}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prepared For</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginTop: '4px' }}>{customerName || 'Wholesale Enquiry'}</div>
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quotation Total</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#1B4332', marginTop: '2px' }}>{fmtCurrency(quoteTotal)}</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{fmt(totalQuantity)} total units</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
        <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Type</th>
              <th style={thRight}>Qty</th>
              <th style={thRight}>Retail</th>
              <th style={thRight}>Wholesale</th>
              <th style={thRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            {pricedLines.map((item) => (
              <tr key={item.id}>
                <td style={{ ...td, whiteSpace: 'normal', fontWeight: 800, color: '#111827' }}>{item.product.name}</td>
                <td style={td}>{item.product.base_type}</td>
                <td style={tdRight}>{fmt(item.quantity)}</td>
                <td style={tdRight}>{fmtCurrency(item.product.unit_price)}</td>
                <td style={tdRight}>
                  <div style={{ fontWeight: 800, color: '#111827' }}>{fmtCurrency(item.unitPrice)}</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>
                    {item.discount > 0 ? `${Math.round(item.discount * 100)}% off - ${item.tierLabel}` : item.tierLabel}
                  </div>
                </td>
                <td style={{ ...tdRight, fontWeight: 900, color: '#1B4332' }}>{fmtCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ ...td, fontWeight: 900, color: '#111827', background: '#F9FAFB' }} colSpan={2}>Total</td>
              <td style={{ ...tdRight, fontWeight: 900, color: '#111827', background: '#F9FAFB' }}>{fmt(totalQuantity)}</td>
              <td style={{ ...td, background: '#F9FAFB' }} />
              <td style={{ ...td, background: '#F9FAFB' }} />
              <td style={{ ...tdRight, fontWeight: 900, color: '#1B4332', background: '#F9FAFB' }}>{fmtCurrency(quoteTotal)}</td>
            </tr>
          </tfoot>
        </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4B5563', lineHeight: 1.55 }}>
            <strong style={{ color: '#111827' }}>Pricing rationale:</strong> Retail price is used as the anchor. Mixed assortment and bulk quotations apply the tier by total enquiry quantity; standard wholesale applies the tier per SKU.
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4B5563', lineHeight: 1.55 }}>
            <strong style={{ color: '#111827' }}>Notes:</strong> {notes || 'Prices are indicative and subject to final confirmation.'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WholesalePricingClient({ products }) {
  const [tab, setTab] = useState('quote');

  const activeCount = products.filter(p => p.is_active && p.in_stock).length;
  const inactiveCount = products.length - activeCount;
  const retailAverage = useMemo(() => {
    if (!products.length) return 0;
    return products.reduce((sum, p) => sum + Number(p.unit_price || 0), 0) / products.length;
  }, [products]);

  const tabStyle = (active) => ({
    padding: '8px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '13px',
    fontWeight: active ? 700 : 500,
    background: active ? '#1B4332' : 'transparent',
    color: active ? '#FFFFFF' : '#6B7280',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  const privateLabelRows = [
    {
      combination: 'Retail sleeve only',
      moq: '150+ units',
      pricing: 'Standard wholesale base plus sleeve/artwork setup',
      use: 'Retailers who want their brand on an existing Healing Soil formula.',
      rationale: 'Sleeves require print coordination, proofing, and label application, so setup should not be absorbed into standard wholesale price.',
    },
    {
      combination: 'Custom box packaging',
      moq: '250+ units',
      pricing: 'Quote-based using product price, box cost, artwork, and packing labour',
      use: 'Boutiques, hotels, and premium gifting partners.',
      rationale: 'Boxes change both material cost and packing time, and suppliers commonly require higher print quantities.',
    },
    {
      combination: 'Formula or fragrance variation',
      moq: '300+ units',
      pricing: 'Quote-based with sampling and batch-change charge',
      use: 'Brands that need a distinctive fragrance, colour, additive, or positioning.',
      rationale: 'Formula changes add testing, batch risk, procurement variance, and separate production planning.',
    },
  ];

  const customRows = [
    {
      combination: 'Wedding or event favour',
      moq: '50+ units',
      pricing: 'Standard wholesale base plus custom tag, sleeve, or ribbon cost',
      use: 'Small events where personalization is mostly packaging.',
      rationale: 'Base soap can stay standard while finishing labour and packaging are charged separately.',
    },
    {
      combination: 'Corporate gifting',
      moq: '100+ units',
      pricing: 'Standard wholesale base plus gift box, insert, and branding setup',
      use: 'Companies ordering seasonal hampers or client gifts.',
      rationale: 'The soap price should remain transparent while gift presentation is priced as an add-on.',
    },
    {
      combination: 'Hotel or amenity supply',
      moq: '150+ units',
      pricing: 'Standard or bulk base depending on label requirement',
      use: 'Hotels, stays, spas, and wellness spaces that need repeatable supply.',
      rationale: 'Amenity buyers often value simple packaging and consistent reorder pricing more than retail presentation.',
    },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard label="Products" value={fmt(products.length)} note={`${activeCount} active, ${inactiveCount} inactive`} />
        <SummaryCard label="Average Retail" value={fmtCurrency(retailAverage)} note="Used only as an overview benchmark" />
        <SummaryCard label="Minimum MOQ" value="50" note="First wholesale tier in this report" />
      </div>

      <div style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        color: '#78350F',
        fontSize: '13px',
        lineHeight: 1.55,
      }}>
        <div style={{ fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>Pricing rationale</div>
        Handmade soap wholesale commonly uses retail discounts or cost-plus pricing. This report uses retail as the anchor because SoapLedger does not store per-product COGS yet. MOQ tiers reward larger production quantities, mixed-SKU ordering helps retailers test variety, bulk/unlabelled pricing reduces packaging effort, and private label stays quote-based because artwork, sleeves, boxes, stamping, and formula changes materially affect cost.
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        overflowX: 'scroll',
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '4px',
        width: '100%',
        marginBottom: '12px',
        scrollbarColor: '#9CA3AF #F3F4F6',
        scrollbarWidth: 'thin',
      }}>
        {TABS.map((item) => (
          <button key={item.id} style={tabStyle(tab === item.id)} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <PricingGuidance mode={tab} />

      {tab === 'standard' && (
        <PricingTable products={products} tiers={STANDARD_TIERS} mode="standard" />
      )}

      {tab === 'quote' && (
        <QuotationBuilder products={products} />
      )}

      {tab === 'mixed' && (
        <div>
          <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.55, marginBottom: '14px' }}>
            Mixed assortment uses the same unit prices as standard wholesale, but the MOQ can be reached across multiple products instead of 50, 100, or 150 units of a single SKU.
          </div>
          <PricingTable products={products} tiers={STANDARD_TIERS} mode="mixed" />
        </div>
      )}

      {tab === 'bulk' && (
        <PricingTable products={products} tiers={BULK_TIERS} mode="bulk" />
      )}

      {tab === 'private' && (
        <GuidanceTable rows={privateLabelRows} />
      )}

      {tab === 'custom' && (
        <GuidanceTable rows={customRows} />
      )}
    </div>
  );
}
