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

const PACKAGING_OPTIONS = {
  standard: {
    label: 'Standard labelled wrap',
    unitCost: 8,
    shippingUnitCost: 6,
    retailBox: 'Wrap/band only; no individual box',
    description: 'Basic wholesale-ready labelled wrap or belly band, plus carton and shipping buffer.',
  },
  kraftBox: {
    label: 'Individual kraft soap box',
    unitCost: 15,
    shippingUnitCost: 8,
    retailBox: '90 x 62 x 25 mm',
    description: 'Retail shelf box for 50g bars, plus carton and shipping buffer.',
  },
  giftBox: {
    label: 'Gift box / event finish',
    unitCost: 30,
    shippingUnitCost: 10,
    retailBox: 'Single: 90 x 65 x 30 mm; 4-bar set: 130 x 95 x 35 mm',
    description: 'Event or premium presentation finish, plus carton and shipping buffer.',
  },
  unlabelled: {
    label: 'Bulk unlabelled',
    unitCost: 3,
    shippingUnitCost: 6,
    retailBox: 'No retail box',
    description: 'Low-cost protective packing for bulk/unlabelled buyer orders, plus carton and shipping buffer.',
  },
};

const SHIPPING_BOXES = [
  { min: 1, max: 24, label: 'Small shipper', dimensions: '9 x 6 x 3 in / 23 x 15 x 8 cm' },
  { min: 25, max: 50, label: 'Half-case shipper', dimensions: '12 x 9 x 4 in / 30 x 23 x 10 cm' },
  { min: 51, max: 100, label: 'Case shipper', dimensions: '12 x 9 x 6 in / 30 x 23 x 15 cm' },
  { min: 101, max: 200, label: 'Large case shipper', dimensions: '15 x 12 x 8 in / 38 x 30 x 20 cm' },
  { min: 201, max: Infinity, label: 'Multi-carton order', dimensions: 'Split into 12 x 9 x 6 in or 15 x 12 x 8 in cartons' },
];

const PRICING_COMBINATIONS = {
  quote: {
    title: 'Quotation Builder',
    formula: 'Uses the selected pricing combination below, then calculates line total = quoted unit price x quantity.',
    rationale: 'Use this when an enquiry arrives and you need a clean PDF-ready quote for eligible 50g soap variants.',
  },
  standard: {
    title: 'Standard Wholesale',
    formula: 'Per SKU: 50g retail anchor x 75% at MOQ 50, x 70% at MOQ 100, x 65% at MOQ 150. Unit prices round to nearest ₹5.',
    rationale: 'Best for single-variety wholesale because each product must independently meet the MOQ, keeping batching and inventory planning simple.',
  },
  mixed: {
    title: 'Mixed Assortment',
    formula: 'Same 50g unit discounts as standard wholesale, but MOQ is met by total units across products.',
    rationale: 'Best for retailers who want variety. It supports discovery orders while still protecting production volume.',
  },
  bulk: {
    title: 'Bulk / Unlabelled',
    formula: '50g retail anchor x 70% at MOQ 50, x 65% at MOQ 100, x 60% at MOQ 150. Unit prices round to nearest ₹5.',
    rationale: 'Best when soaps do not need retail labels or custom packaging. Lower finishing effort allows a deeper discount.',
  },
  private: {
    title: 'Private Label',
    formula: 'Quote-based: product wholesale base + packaging profile + sleeve/box/artwork/setup + any formula or fragrance change cost.',
    rationale: 'Packaging runs, artwork proofing, sleeves, boxes, stamping, and formula changes can vary widely, so exact pricing should not be automated from retail alone.',
  },
  custom: {
    title: 'Custom / Event',
    formula: 'Standard wholesale base + packaging profile + event-specific add-ons such as tags, ribbons, boxes, inserts, stamps, fragrance, or rush work.',
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

function printWholesaleSection(target) {
  const root = document.documentElement;
  root.dataset.wholesalePrintTarget = target;

  const cleanup = () => {
    delete root.dataset.wholesalePrintTarget;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  window.setTimeout(cleanup, 1000);
}

function getApplicableTier(quantity, tiers) {
  return [...tiers].reverse().find((tier) => quantity >= tier.qty) || null;
}

function isWholesaleEligible(product) {
  return Boolean(
    product?.is_active &&
    product?.in_stock &&
    product?.is_wholesale_eligible
  );
}

function getWholesaleVariantPrice(product) {
  const retailPrice = Number(product?.unit_price || 0);
  const weight = Number(product?.weight_grams || 0);

  if (weight > 0 && weight !== 50) {
    return roundToNearestFive((retailPrice / weight) * 50);
  }

  return roundToNearestFive(retailPrice);
}

function getQuoteUnitPrice(product, mode, lineQuantity, totalQuantity) {
  const retailPrice = getWholesaleVariantPrice(product);
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

function getShippingBox(totalQuantity) {
  return SHIPPING_BOXES.find((box) => totalQuantity >= box.min && totalQuantity <= box.max) || SHIPPING_BOXES[0];
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

function BaseTypePriceMatrix({ products }) {
  const rows = Object.values(products.reduce((groups, product) => {
    const type = product.base_type || 'Other';
    if (!groups[type]) groups[type] = {
      baseType: type,
      retailAnchors: [],
    };

    groups[type].retailAnchors.push(getWholesaleVariantPrice(product));
    return groups;
  }, {})).map((row) => {
    const retailAnchor = Math.max(...row.retailAnchors);
    return {
      baseType: row.baseType,
      prices: Object.fromEntries(STANDARD_TIERS.map((tier) => [
        tier.qty,
        roundToNearestFive(retailAnchor * (1 - tier.discount)),
      ])),
    };
  }).sort((a, b) => a.baseType.localeCompare(b.baseType));

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Wholesale price report</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
          Wholesale prices by soap base type and order quantity.
        </p>
      </div>
      <ScrollFrame>
        <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={th}>Base Type</th>
              {STANDARD_TIERS.map((tier) => (
                <th key={tier.qty} style={thRight}>
                  Qty {tier.qty}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.baseType}>
                <td style={{ ...td, fontWeight: 800, color: '#111827' }}>
                  <TypeBadge type={row.baseType} />
                </td>
                {STANDARD_TIERS.map((tier) => (
                  <td key={`standard-${tier.qty}`} style={{ ...tdRight, fontWeight: 800, color: '#111827' }}>{fmtCurrency(row.prices[tier.qty])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollFrame>
    </div>
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
  const activeProducts = useMemo(() => products.filter(isWholesaleEligible), [products]);
  const productById = useMemo(() => {
    const map = {};
    for (const product of products) map[product.id] = product;
    return map;
  }, [products]);
  const productsByType = useMemo(() => {
    return activeProducts.reduce((groups, product) => {
      const type = product.base_type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(product);
      return groups;
    }, {});
  }, [activeProducts]);
  const groupTypes = Object.keys(productsByType).sort((a, b) => {
    const preferred = ['Glycerine', 'Goat Milk', 'Shea Butter'];
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.localeCompare(b);
  });

  const [quoteMode, setQuoteMode] = useState('mixed');
  const [packagingMode, setPackagingMode] = useState('standard');
  const [customerName, setCustomerName] = useState('');
  const [quoteDate, setQuoteDate] = useState(todayIso);
  const [validUntil, setValidUntil] = useState(() => futureIso(7));
  const [notes, setNotes] = useState('Unit prices include the selected packaging and shipping buffer. Custom artwork, stamping, inserts, and rush work are quoted separately where applicable.');
  const [bulkQty, setBulkQty] = useState(50);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
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
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const addProducts = (selectedProducts, quantity = 50) => {
    setItems((current) => {
      const existing = new Set(current.map((item) => item.productId));
      const additions = selectedProducts
        .filter((product) => !existing.has(product.id))
        .map((product) => ({
          id: crypto.randomUUID(),
          productId: product.id,
          quantity,
        }));
      return [...current, ...additions];
    });
  };

  const removeByType = (type) => {
    setItems((current) => {
      const next = current.filter((item) => productById[item.productId]?.base_type !== type);
      const nextIds = new Set(next.map((item) => item.id));
      setSelectedIds((selected) => new Set([...selected].filter((id) => nextIds.has(id))));
      return next;
    });
  };

  const removeSelected = () => {
    setItems((current) => current.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  };

  const clearQuote = () => {
    setItems([]);
    setSelectedIds(new Set());
  };

  const toggleLine = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllLines = () => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const applyBulkQuantity = () => {
    const quantity = Math.max(0, Number(bulkQty || 0));
    setItems((current) => current.map((item) => (
      selectedIds.size === 0 || selectedIds.has(item.id)
        ? { ...item, quantity }
        : item
    )));
  };

  const distributeBulkTotal = () => {
    const total = Math.max(0, Number(bulkTotal || 0));
    const targetItems = selectedIds.size > 0
      ? items.filter((item) => selectedIds.has(item.id))
      : items;
    if (!targetItems.length) return;

    const baseQty = Math.floor(total / targetItems.length);
    const remainder = total % targetItems.length;
    const targetIds = new Set(targetItems.map((item) => item.id));

    setItems((current) => {
      let index = 0;
      return current.map((item) => {
        if (!targetIds.has(item.id)) return item;
        const quantity = baseQty + (index < remainder ? 1 : 0);
        index += 1;
        return { ...item, quantity };
      });
    });
  };

  const loadAllVarietiesPreset = () => {
    setQuoteMode('mixed');
    setItems(activeProducts.map((product) => ({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 50,
    })));
    setSelectedIds(new Set());
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
    setSelectedIds(new Set());
  };

  const quoteLines = items
    .map((item) => ({ ...item, product: productById[item.productId] }))
    .filter((item) => item.product && item.quantity > 0);
  const totalQuantity = quoteLines.reduce((sum, item) => sum + item.quantity, 0);
  const packaging = PACKAGING_OPTIONS[packagingMode] || PACKAGING_OPTIONS.standard;
  const pricedLines = quoteLines.map((item) => {
    const price = getQuoteUnitPrice(item.product, quoteMode, item.quantity, totalQuantity);
    const fulfillmentUnitCost = packaging.unitCost + packaging.shippingUnitCost;
    const quotedUnitPrice = price.unitPrice + fulfillmentUnitCost;
    return {
      ...item,
      ...price,
      fulfillmentUnitCost,
      quotedUnitPrice,
      lineTotal: quotedUnitPrice * item.quantity,
    };
  });
  const quoteTotal = pricedLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const baseSubtotal = pricedLines.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const fulfillmentTotal = pricedLines.reduce((sum, item) => sum + (item.fulfillmentUnitCost * item.quantity), 0);
  const quoteModeLabel = QUOTE_MODE_LABELS[quoteMode];
  const shippingBox = getShippingBox(totalQuantity);
  const belowMoq = pricedLines.some((item) => item.discount === 0);

  return (
    <div>
      <style jsx global>{`
        @media print {
          html[data-wholesale-print-target] body * {
            visibility: hidden !important;
          }
          html[data-wholesale-print-target="quote"] .quotation-print-area,
          html[data-wholesale-print-target="quote"] .quotation-print-area *,
          html[data-wholesale-print-target="report"] .wholesale-report-print-area,
          html[data-wholesale-print-target="report"] .wholesale-report-print-area * {
            visibility: visible !important;
          }
          html[data-wholesale-print-target="quote"] .quotation-print-area,
          html[data-wholesale-print-target="report"] .wholesale-report-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            padding: 22mm !important;
            background: #ffffff !important;
          }
          html[data-wholesale-print-target] .quotation-no-print,
          html[data-wholesale-print-target] .wholesale-no-print {
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
              onClick={() => printWholesaleSection('quote')}
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
            <div>
              <label style={labelStyle()}>Unit Price Includes</label>
              <select value={packagingMode} onChange={(e) => setPackagingMode(e.target.value)} style={inputStyle()}>
                {Object.entries(PACKAGING_OPTIONS).map(([key, option]) => (
                  <option key={key} value={key}>{option.label} (+{fmtCurrency(option.unitCost + option.shippingUnitCost)} / unit)</option>
                ))}
              </select>
            </div>
          </div>

          <PricingGuidance mode={quoteMode} compact />

          <div style={{ border: '1px solid #DBEAFE', borderRadius: '8px', background: '#EFF6FF', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#1D4ED8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Packaging and box sizing</div>
            <div style={{ fontSize: '13px', color: '#1E3A8A', lineHeight: 1.5, marginTop: '4px' }}>
              {packaging.description} Retail box: {packaging.retailBox}. Suggested shipper for this quote: {shippingBox.label}, {shippingBox.dimensions}. This adds {fmtCurrency(packaging.unitCost + packaging.shippingUnitCost)} into each quoted unit price.
            </div>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Fast add eligible 50g soap variants
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button onClick={loadAllVarietiesPreset} style={{ minHeight: '36px', border: '1px solid #1B4332', borderRadius: '6px', padding: '7px 11px', background: '#F0FDF4', color: '#1B4332', fontWeight: 800, cursor: 'pointer' }}>
                Replace with all varieties x 50
              </button>
              <button onClick={loadGlycerinePreset} style={{ minHeight: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 11px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
                Neem Tulsi + Honey Oats x 100
              </button>
              <button onClick={addLine} style={{ minHeight: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 11px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
                Add one line
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {groupTypes.map((type) => (
                <button key={type} onClick={() => addProducts(productsByType[type], 50)} style={{ minHeight: '34px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '6px 10px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
                  Add all {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FFFFFF', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Bulk edit selected lines
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle()}>Set qty per selected line</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" min="0" step="1" value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} style={inputStyle()} />
                  <button onClick={applyBulkQuantity} style={{ minHeight: '40px', border: '1px solid #1B4332', borderRadius: '6px', padding: '8px 10px', background: '#1B4332', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Apply
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle()}>Distribute total units</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" min="0" step="1" value={bulkTotal} onChange={(e) => setBulkTotal(e.target.value)} placeholder="e.g. 500" style={inputStyle()} />
                  <button onClick={distributeBulkTotal} style={{ minHeight: '40px', border: '1px solid #1B4332', borderRadius: '6px', padding: '8px 10px', background: '#F0FDF4', color: '#1B4332', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Split
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={selectAllLines} style={{ minHeight: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 10px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
                  Select all
                </button>
                <button onClick={clearSelection} style={{ minHeight: '36px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '7px 10px', background: '#FFFFFF', color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
                  Clear selection
                </button>
                <button onClick={removeSelected} disabled={selectedIds.size === 0} style={{ minHeight: '36px', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '7px 10px', background: selectedIds.size ? '#FEF2F2' : '#F3F4F6', color: selectedIds.size ? '#991B1B' : '#9CA3AF', fontWeight: 800, cursor: selectedIds.size ? 'pointer' : 'not-allowed' }}>
                  Remove selected
                </button>
                <button onClick={clearQuote} style={{ minHeight: '36px', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '7px 10px', background: '#FFFFFF', color: '#991B1B', fontWeight: 800, cursor: 'pointer' }}>
                  Clear quote
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {groupTypes.map((type) => (
                <button key={type} onClick={() => removeByType(type)} style={{ minHeight: '32px', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '5px 9px', background: '#FEF2F2', color: '#991B1B', fontWeight: 700, cursor: 'pointer' }}>
                  Remove {type}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', lineHeight: 1.45 }}>
              Bulk actions apply to selected lines. If nothing is selected, quantity updates apply to all quote lines.
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '32px minmax(220px, 1fr) 110px 44px', gap: '8px', alignItems: 'end', padding: '10px', border: selectedIds.has(item.id) ? '1px solid #1B4332' : '1px solid #E5E7EB', borderRadius: '8px', background: selectedIds.has(item.id) ? '#F0FDF4' : '#FFFFFF' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px' }}>
                  <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleLine(item.id)} />
                </label>
                <div>
                  <label style={labelStyle()}>50g Soap Variant</label>
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
          <SummaryCard label="Base Subtotal" value={fmtCurrency(baseSubtotal)} note={`${quoteModeLabel || 'Wholesale'} pricing before built-in packing and shipping`} />
          <div style={{ height: '10px' }} />
          <SummaryCard label="Built Into Unit Prices" value={fmtCurrency(fulfillmentTotal)} note={`${packaging.label}, packing carton, and shipping buffer`} />
          <div style={{ height: '10px' }} />
          <SummaryCard label="Quote Total" value={fmtCurrency(quoteTotal)} note="Quoted unit prices already include packing and shipping buffer" />
          <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: '#EFF6FF', color: '#1E3A8A', fontSize: '12px', lineHeight: 1.45 }}>
            Suggested shipper: <strong>{shippingBox.label}</strong>, {shippingBox.dimensions}.
          </div>
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
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{fmt(totalQuantity)} total units; unit prices include packing and shipping buffer</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
        <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Type</th>
              <th style={thRight}>Qty</th>
              <th style={thRight}>50g Anchor</th>
              <th style={thRight}>Quoted Unit</th>
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
                  <div style={{ fontWeight: 800, color: '#111827' }}>{fmtCurrency(item.quotedUnitPrice)}</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>
                    {item.discount > 0 ? `${Math.round(item.discount * 100)}% off - ${item.tierLabel}` : item.tierLabel}; packing/shipping included
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4B5563', lineHeight: 1.55 }}>
            <strong style={{ color: '#111827' }}>Payment terms:</strong> 100% advance payment required before order processing.
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4B5563', lineHeight: 1.55 }}>
            <strong style={{ color: '#111827' }}>Fulfilment included in unit price:</strong> {packaging.label}, retail packaging: {packaging.retailBox}. Suggested shipper: {shippingBox.label}, {shippingBox.dimensions}. Confirm final carton after wrapping a sample batch.
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
  const wholesaleProducts = useMemo(() => products.filter(isWholesaleEligible), [products]);

  return (
    <div>
      <div className="wholesale-report-print-area" style={{ background: '#FFFFFF' }}>
        <div className="wholesale-no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={() => printWholesaleSection('report')}
            style={{
              minHeight: '40px',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 14px',
              background: '#1B4332',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Print / Save PDF
          </button>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '18px',
          alignItems: 'flex-start',
          borderBottom: '2px solid #1B4332',
          paddingBottom: '14px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', color: '#1B4332', fontSize: '32px', lineHeight: 1 }}>
              Healing Soil
            </div>
            <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>
              Handmade soap wholesale price list
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#374151', fontSize: '12px', lineHeight: 1.7 }}>
            <div><strong>Minimum order:</strong> 50 units</div>
            <div><strong>Payment terms:</strong> 100% advance payment before order processing</div>
          </div>
        </div>

        <div style={{
          background: '#F0FDF4',
          border: '1px solid #D1FAE5',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '20px',
          color: '#064E3B',
          fontSize: '13px',
          lineHeight: 1.55,
        }}>
          Base prices are for 50g handmade soap wholesale orders before fulfilment buffer. Use the quotation builder below to bake packaging, carton, and shipping allowance into the quoted unit price. Recommended individual kraft box size for 50g bars is 90 x 62 x 25 mm; ship 50-unit wholesale cases in a 12 x 9 x 4 in carton, moving to 12 x 9 x 6 in cartons for 100 units.
        </div>

        <BaseTypePriceMatrix products={wholesaleProducts} />
      </div>

      <div style={{
        marginTop: '24px',
        marginBottom: '14px',
        paddingTop: '20px',
        borderTop: '1px solid #E5E7EB',
      }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Interested enquiry quote</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', lineHeight: 1.5 }}>
          Use this only after a buyer expresses interest, when you need a product-level quote for mixed assortments, bulk/unlabelled orders, or custom/event work.
        </p>
      </div>

      <div style={{
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '14px',
      }}>
        <QuotationBuilder products={products} />
      </div>
    </div>
  );
}
