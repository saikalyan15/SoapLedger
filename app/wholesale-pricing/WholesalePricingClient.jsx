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
    rationale: 'Use this when an enquiry arrives and you need a clean PDF-ready quote for eligible soap variants in 50g or 100g.',
  },
  standard: {
    title: 'Standard Wholesale',
    formula: 'Per SKU: retail anchor for the quoted size (50g or 100g) x 75% at MOQ 50, x 70% at MOQ 100, x 65% at MOQ 150. Unit prices round to nearest ₹5.',
    rationale: 'Best for single-variety wholesale because each product must independently meet the MOQ, keeping batching and inventory planning simple.',
  },
  mixed: {
    title: 'Mixed Assortment',
    formula: 'Same per-size unit discounts as standard wholesale, but MOQ is met by total units across products.',
    rationale: 'Best for retailers who want variety. It supports discovery orders while still protecting production volume.',
  },
  bulk: {
    title: 'Bulk / Unlabelled',
    formula: 'Retail anchor for the quoted size (50g or 100g) x 70% at MOQ 50, x 65% at MOQ 100, x 60% at MOQ 150. Unit prices round to nearest ₹5.',
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

const SIZE_OPTIONS_GRAMS = [50, 100];
const MAX_SAMPLE_VARIETIES = 6;

const DIFFERENTIATION_POINTS = [
  'Made to order in small batches, not mass-produced and held in stock ahead of demand.',
  'Organic and hand-sourced ingredients bought in limited quantity, not bulk industrial supply.',
  'Free of SLS and parabens in every bar.',
  'Formulas and packaging can be adjusted to your specification — most manufacturers require large minimums to customize.',
  'Batch sizes are limited by ingredient availability, not held back artificially; lead times reflect real sourcing, not manufactured scarcity.',
];

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

function getWholesaleVariantPrice(product, sizeGrams = 50) {
  const retailPrice = Number(product?.unit_price || 0);
  const weight = Number(product?.weight_grams || 0);

  if (weight > 0 && weight !== sizeGrams) {
    return roundToNearestFive((retailPrice / weight) * sizeGrams);
  }

  return roundToNearestFive(retailPrice);
}

function getQuoteUnitPrice(product, mode, sizeGrams, lineQuantity, totalQuantity) {
  const retailPrice = getWholesaleVariantPrice(product, sizeGrams);
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

function buildPriceMatrixRows(products, sizeGrams) {
  return Object.values(products.reduce((groups, product) => {
    const type = product.base_type || 'Other';
    if (!groups[type]) groups[type] = {
      baseType: type,
      retailAnchors: [],
    };

    groups[type].retailAnchors.push(getWholesaleVariantPrice(product, sizeGrams));
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
}

function PriceMatrixTable({ title, rows }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{title}</div>
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
                  <td key={`tier-${tier.qty}`} style={{ ...tdRight, fontWeight: 800, color: '#111827' }}>{fmtCurrency(row.prices[tier.qty])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollFrame>
    </div>
  );
}

function BaseTypePriceMatrix({ products }) {
  const rows50 = buildPriceMatrixRows(products, 50);
  const rows100 = buildPriceMatrixRows(products, 100);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Wholesale price report</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
          Wholesale prices by soap base type, size, and order quantity.
        </p>
      </div>
      <PriceMatrixTable title="50g bars" rows={rows50} />
      <PriceMatrixTable title="100g bars" rows={rows100} />
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

function ProductSelectionGrid({ groupTypes, productsByType, items, onToggle, onSetSize, onSetQuantity, onSelectAllInType, onClearType }) {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FFFFFF', padding: '12px', marginBottom: '14px' }}>
      <div style={{ fontSize: '12px', fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        Select soaps for this quote
      </div>
      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px', lineHeight: 1.45 }}>
        Check each soap you want to quote, then set its size (50g or 100g) and quantity.
      </div>
      {groupTypes.map((type) => {
        const groupProducts = productsByType[type] || [];
        return (
          <div key={type} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <TypeBadge type={type} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => onSelectAllInType(type)} style={{ minHeight: '28px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '4px 8px', background: '#FFFFFF', color: '#374151', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  Select all
                </button>
                <button type="button" onClick={() => onClearType(type)} style={{ minHeight: '28px', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '4px 8px', background: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {groupProducts.map((product) => {
                const entry = items[product.id];
                const checked = Boolean(entry);
                return (
                  <div
                    key={product.id}
                    onClick={() => onToggle(product.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      border: checked ? '1px solid #1B4332' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      background: checked ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggle(product.id)}
                      style={{ accentColor: '#1B4332', width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: '160px', fontSize: '13px', fontWeight: checked ? 800 : 600, color: '#111827' }}>
                      {product.name}
                    </div>
                    {checked && (
                      <>
                        <select
                          value={entry.size}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onSetSize(product.id, Number(e.target.value))}
                          style={{ ...inputStyle(), width: '90px', minHeight: '34px' }}
                        >
                          {SIZE_OPTIONS_GRAMS.map((size) => (
                            <option key={size} value={size}>{size}g</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={entry.quantity}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onSetQuantity(product.id, e.target.value)}
                          style={{ ...inputStyle(), width: '80px', minHeight: '34px' }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const [bulkSize, setBulkSize] = useState(50);
  const [includeSamples, setIncludeSamples] = useState(true);
  // items is keyed by productId (one line per product); a buyer wanting both 50g and 100g
  // of the same soap in one quote isn't representable today — out of scope, not requested.
  const [items, setItems] = useState({});

  const toggleProduct = (productId) => {
    setItems((current) => {
      if (current[productId]) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: { size: 50, quantity: 50 } };
    });
  };

  const setItemSize = (productId, size) => {
    setItems((current) => (
      current[productId] ? { ...current, [productId]: { ...current[productId], size } } : current
    ));
  };

  const setItemQuantity = (productId, quantity) => {
    setItems((current) => (
      current[productId]
        ? { ...current, [productId]: { ...current[productId], quantity: Math.max(0, Number(quantity || 0)) } }
        : current
    ));
  };

  const selectAllInType = (type) => {
    setItems((current) => {
      const next = { ...current };
      for (const product of productsByType[type] || []) {
        if (!next[product.id]) next[product.id] = { size: 50, quantity: 50 };
      }
      return next;
    });
  };

  const clearType = (type) => {
    setItems((current) => {
      const next = { ...current };
      for (const product of productsByType[type] || []) {
        delete next[product.id];
      }
      return next;
    });
  };

  const clearAll = () => setItems({});

  const setQuantityForAll = () => {
    const quantity = Math.max(0, Number(bulkQty || 0));
    setItems((current) => Object.fromEntries(
      Object.entries(current).map(([id, entry]) => [id, { ...entry, quantity }])
    ));
  };

  const distributeTotalAcrossAll = () => {
    const total = Math.max(0, Number(bulkTotal || 0));
    const ids = Object.keys(items);
    if (!ids.length) return;
    const baseQty = Math.floor(total / ids.length);
    const remainder = total % ids.length;
    setItems((current) => {
      const next = {};
      ids.forEach((id, index) => {
        next[id] = { ...current[id], quantity: baseQty + (index < remainder ? 1 : 0) };
      });
      return next;
    });
  };

  const setSizeForAll = () => {
    setItems((current) => Object.fromEntries(
      Object.entries(current).map(([id, entry]) => [id, { ...entry, size: bulkSize }])
    ));
  };

  const quoteLines = Object.entries(items)
    .map(([productId, entry]) => ({ productId, ...entry, product: productById[productId] }))
    .filter((line) => line.product && line.quantity > 0);
  const totalQuantity = quoteLines.reduce((sum, item) => sum + item.quantity, 0);
  const packaging = PACKAGING_OPTIONS[packagingMode] || PACKAGING_OPTIONS.standard;
  const pricedLines = quoteLines.map((item) => {
    const price = getQuoteUnitPrice(item.product, quoteMode, item.size, item.quantity, totalQuantity);
    const anchorPrice = getWholesaleVariantPrice(item.product, item.size);
    const fulfillmentUnitCost = packaging.unitCost + packaging.shippingUnitCost;
    const quotedUnitPrice = price.unitPrice + fulfillmentUnitCost;
    return {
      ...item,
      ...price,
      anchorPrice,
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

  // Complimentary sample selection is presentation-only: it is never added into
  // quoteTotal / baseSubtotal / fulfillmentTotal above.
  const sortedForSampling = [...quoteLines].sort((a, b) => a.product.name.localeCompare(b.product.name));
  const sampleVarietyCount = quoteLines.length;
  const sampledLines = sortedForSampling.slice(0, MAX_SAMPLE_VARIETIES);
  const sampleOverflowCount = Math.max(0, sampleVarietyCount - MAX_SAMPLE_VARIETIES);

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

          <ProductSelectionGrid
            groupTypes={groupTypes}
            productsByType={productsByType}
            items={items}
            onToggle={toggleProduct}
            onSetSize={setItemSize}
            onSetQuantity={setItemQuantity}
            onSelectAllInType={selectAllInType}
            onClearType={clearType}
          />

          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F9FAFB', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Bulk edit quote lines
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle()}>Set qty for all lines</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" min="0" step="1" value={bulkQty} onChange={(e) => setBulkQty(e.target.value)} style={inputStyle()} />
                  <button onClick={setQuantityForAll} style={{ minHeight: '40px', border: '1px solid #1B4332', borderRadius: '6px', padding: '8px 10px', background: '#1B4332', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Apply
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle()}>Distribute total units</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" min="0" step="1" value={bulkTotal} onChange={(e) => setBulkTotal(e.target.value)} placeholder="e.g. 500" style={inputStyle()} />
                  <button onClick={distributeTotalAcrossAll} style={{ minHeight: '40px', border: '1px solid #1B4332', borderRadius: '6px', padding: '8px 10px', background: '#F0FDF4', color: '#1B4332', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Split
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle()}>Set size for all lines</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={bulkSize} onChange={(e) => setBulkSize(Number(e.target.value))} style={inputStyle()}>
                    {SIZE_OPTIONS_GRAMS.map((size) => (
                      <option key={size} value={size}>{size}g</option>
                    ))}
                  </select>
                  <button onClick={setSizeForAll} style={{ minHeight: '40px', border: '1px solid #1B4332', borderRadius: '6px', padding: '8px 10px', background: '#1B4332', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Apply
                  </button>
                </div>
              </div>
              <button onClick={clearAll} style={{ minHeight: '36px', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '7px 10px', background: '#FFFFFF', color: '#991B1B', fontWeight: 800, cursor: 'pointer' }}>
                Clear quote
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', lineHeight: 1.45 }}>
              Bulk actions apply to every line currently in the quote. Use the checkboxes above, or the &ldquo;Clear&rdquo; button per soap type, to change what&apos;s in the quote first.
            </div>
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

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E5E7EB' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
              <input type="checkbox" checked={includeSamples} onChange={(e) => setIncludeSamples(e.target.checked)} style={{ accentColor: '#1B4332', width: '16px', height: '16px' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>Include complimentary evaluation samples</span>
            </label>
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
              {quoteLines.length === 0 ? (
                'Add products to the quote to see which sample pieces would be included.'
              ) : (
                <>
                  One small sample piece per variety, no charge. Full-size soaps are always purchased separately.
                  <div style={{ marginTop: '6px', fontWeight: 700, color: '#374151' }}>
                    {sampledLines.map((line) => line.product.name).join(', ')}
                  </div>
                  {sampleOverflowCount > 0 && (
                    <div style={{ marginTop: '6px', color: '#991B1B' }}>
                      Capped at {MAX_SAMPLE_VARIETIES} varieties &mdash; {sampleOverflowCount} more {sampleOverflowCount === 1 ? 'variety is' : 'varieties are'} quoted but not sampled.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Value points included in printed quote</div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#4B5563', lineHeight: 1.6 }}>
              {DIFFERENTIATION_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
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
        <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Type</th>
              <th style={th}>Size</th>
              <th style={thRight}>Qty</th>
              <th style={thRight}>Wholesale Anchor</th>
              <th style={thRight}>Quoted Unit</th>
              <th style={thRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            {pricedLines.map((item) => (
              <tr key={item.productId}>
                <td style={{ ...td, whiteSpace: 'normal', fontWeight: 800, color: '#111827' }}>{item.product.name}</td>
                <td style={td}>{item.product.base_type}</td>
                <td style={td}>{item.size}g</td>
                <td style={tdRight}>{fmt(item.quantity)}</td>
                <td style={tdRight}>{fmtCurrency(item.anchorPrice)}</td>
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
              <td style={{ ...td, fontWeight: 900, color: '#111827', background: '#F9FAFB' }} colSpan={3}>Total</td>
              <td style={{ ...tdRight, fontWeight: 900, color: '#111827', background: '#F9FAFB' }}>{fmt(totalQuantity)}</td>
              <td style={{ ...td, background: '#F9FAFB' }} />
              <td style={{ ...td, background: '#F9FAFB' }} />
              <td style={{ ...tdRight, fontWeight: 900, color: '#1B4332', background: '#F9FAFB' }}>{fmtCurrency(quoteTotal)}</td>
            </tr>
          </tfoot>
        </table>
        </div>

        {includeSamples && sampleVarietyCount > 0 && (
          <div style={{ border: '1px solid #D1FAE5', borderRadius: '8px', background: '#F0FDF4', padding: '12px', marginBottom: '14px', pageBreakInside: 'avoid' }}>
            <div style={{ fontSize: '11px', color: '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complimentary evaluation samples (no charge)</div>
            <div style={{ fontSize: '12px', color: '#064E3B', lineHeight: 1.55, marginTop: '4px', whiteSpace: 'normal' }}>
              One small sample piece is included per soap variety quoted, at no cost, so you can check scent, texture, and finish before ordering full-size units. Full-size bars are <strong>not</strong> complimentary &mdash; they are priced per the line items above and must be purchased separately.
            </div>
            <div style={{ fontSize: '12px', color: '#064E3B', marginTop: '8px', whiteSpace: 'normal' }}>
              <strong>Varieties sampled with this quote:</strong> {sampledLines.map((line) => line.product.name).join(', ')}.
            </div>
            {sampleOverflowCount > 0 && (
              <div style={{ fontSize: '12px', color: '#064E3B', marginTop: '6px', whiteSpace: 'normal' }}>
                Sample pieces are capped at {MAX_SAMPLE_VARIETIES} varieties per quote. This quote lists {sampleVarietyCount} varieties, so {sampleOverflowCount} additional {sampleOverflowCount === 1 ? 'variety is' : 'varieties are'} quoted above but not included as a sample.
              </div>
            )}
          </div>
        )}

        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '14px', pageBreakInside: 'avoid' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why Healing Soil pricing differs from mass-produced soap</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#4B5563', lineHeight: 1.6, whiteSpace: 'normal' }}>
            {DIFFERENTIATION_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
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
          Base prices are shown for both 50g and 100g handmade soap wholesale orders, before fulfilment buffer. Use the quotation builder below to bake packaging, carton, and shipping allowance into the quoted unit price. Recommended individual kraft box size for 50g bars is 90 x 62 x 25 mm; ship 50-unit wholesale cases in a 12 x 9 x 4 in carton, moving to 12 x 9 x 6 in cartons for 100 units.
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
