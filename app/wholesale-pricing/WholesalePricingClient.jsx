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

const FIFTY_GRAM_IMAGE_BASE = '/50g-soap-squares/images';
const AVAILABLE_FIFTY_GRAM_IMAGES = new Set([
  'ginger-rosemary-glycerin',
  'ginger-rosemary-goat-milk',
  'honey-kesar-haldi-sheabutter',
  'honey-oats-glycerin',
  'honey-oats-goatmilk',
  'kesar-gulab-sheabutter',
  'kesar-haldi-goatmilk',
  'marigold-glycerine',
  'neem-tulsi-glycerine',
  'neem-tulsi-goatmilk',
  'orange-glycerine',
  'orange-goatmilk',
  'pomegranate-glycerin',
  'pomegranate-goatmilk',
  'red-rose',
]);

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
const formatPriceRange = (prices) => {
  const unique = [...new Set(prices.map((price) => Math.round(Number(price || 0))))].sort((a, b) => a - b);
  if (!unique.length) return '—';
  if (unique.length === 1) return fmtCurrency(unique[0]);
  return `${fmtCurrency(unique[0])} - ${fmtCurrency(unique[unique.length - 1])}`;
};
const todayIso = () => new Date().toISOString().slice(0, 10);
const futureIso = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

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

function getProductImage(product) {
  const imageUrl = String(product?.image_url || '').trim();
  const fileName = imageUrl.split('/').pop() || '';
  const slug = fileName.replace(/\.[^.]+$/, '');

  if (AVAILABLE_FIFTY_GRAM_IMAGES.has(slug)) {
    return `${FIFTY_GRAM_IMAGE_BASE}/${slug}-50g.png`;
  }

  if (!imageUrl || imageUrl.includes('coming-soon')) return '/logo/profile-cream.png';
  return imageUrl;
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
  const unitPrice = roundToNearestFive(Number(retailPrice || 0) * (1 - tier.discount));
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
      <table style={{ width: '100%', minWidth: '1080px', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <thead>
          <tr>
            <th style={th}>Product</th>
            <th style={th}>Type</th>
            <th style={thRight}>Wholesale Variant</th>
            <th style={th}>Status</th>
            <th style={thRight}>50g Retail Anchor</th>
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
            const retailPrice = getWholesaleVariantPrice(product);
            const muted = !product.is_active;
            return (
              <tr key={product.id} style={{ background: muted ? '#FAFAFA' : '#FFFFFF' }}>
                <td style={{ ...td, minWidth: '230px', fontWeight: 700, color: muted ? '#9CA3AF' : '#111827', whiteSpace: 'normal' }}>
                  {product.name}
                </td>
                <td style={td}><TypeBadge type={product.base_type || 'Other'} /></td>
                <td style={tdRight}>50g</td>
                <td style={td}><StatusPill product={product} /></td>
                <td style={{ ...tdRight, fontWeight: 700 }}>{fmtCurrency(retailPrice)}</td>
                {tiers.map((tier) => (
                  <PriceCell key={tier.qty} retailPrice={retailPrice} tier={tier} />
                ))}
                <td style={{ ...td, minWidth: '240px', whiteSpace: 'normal', color: '#4B5563', lineHeight: 1.45 }}>
                  {mode === 'bulk'
                    ? 'Lower packaging and labelling effort allows a deeper discount.'
                    : '50g equivalent retail anchor with stronger discount at larger production quantities.'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollFrame>
  );
}

function BaseTypePriceMatrix({ products }) {
  const rows = Object.values(products.reduce((groups, product) => {
    const type = product.base_type || 'Other';
    if (!groups[type]) groups[type] = {
      baseType: type,
      products: [],
      retailAnchors: [],
      standard: Object.fromEntries(STANDARD_TIERS.map((tier) => [tier.qty, []])),
      bulk: Object.fromEntries(BULK_TIERS.map((tier) => [tier.qty, []])),
    };

    const retailAnchor = getWholesaleVariantPrice(product);
    groups[type].products.push(product);
    groups[type].retailAnchors.push(retailAnchor);
    for (const tier of STANDARD_TIERS) {
      groups[type].standard[tier.qty].push(roundToNearestFive(retailAnchor * (1 - tier.discount)));
    }
    for (const tier of BULK_TIERS) {
      groups[type].bulk[tier.qty].push(roundToNearestFive(retailAnchor * (1 - tier.discount)));
    }
    return groups;
  }, {})).sort((a, b) => a.baseType.localeCompare(b.baseType));

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Base type price matrix</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
          Retail anchor and wholesale prices for each eligible 50g soap base type.
        </p>
      </div>
      <ScrollFrame>
        <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={th}>Base Type</th>
              <th style={thRight}>Variants</th>
              <th style={thRight}>50g Retail Anchor</th>
              <th style={thRight}>Standard 50</th>
              <th style={thRight}>Standard 100</th>
              <th style={thRight}>Standard 150</th>
              <th style={thRight}>Bulk 50</th>
              <th style={thRight}>Bulk 100</th>
              <th style={thRight}>Bulk 150</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.baseType}>
                <td style={{ ...td, fontWeight: 800, color: '#111827' }}>
                  <TypeBadge type={row.baseType} />
                </td>
                <td style={tdRight}>{fmt(row.products.length)}</td>
                <td style={{ ...tdRight, fontWeight: 800, color: '#111827' }}>{formatPriceRange(row.retailAnchors)}</td>
                {STANDARD_TIERS.map((tier) => (
                  <td key={`standard-${tier.qty}`} style={tdRight}>{formatPriceRange(row.standard[tier.qty])}</td>
                ))}
                {BULK_TIERS.map((tier) => (
                  <td key={`bulk-${tier.qty}`} style={tdRight}>{formatPriceRange(row.bulk[tier.qty])}</td>
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

function ProductAnnexure({ products }) {
  return (
    <section style={{ pageBreakBefore: 'always', marginTop: '24px' }}>
      <div style={{ borderBottom: '2px solid #1B4332', paddingBottom: '10px', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', color: '#1B4332', fontSize: '28px', lineHeight: 1 }}>
          Annexure: 50g Soap Catalogue
        </div>
        <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '5px', lineHeight: 1.45 }}>
          Product photos are for buyer reference only. Actual colour, texture, botanical distribution, and finish may differ slightly because every soap is handmade in small batches.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {products.map((product) => (
          <div key={product.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF', breakInside: 'avoid' }}>
            <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImage(product)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ padding: '9px 10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#111827', lineHeight: 1.35 }}>{product.name}</div>
              <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '3px' }}>{product.base_type || 'Other'} · 50g wholesale variant</div>
            </div>
          </div>
        ))}
      </div>
    </section>
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
  const [customerName, setCustomerName] = useState('');
  const [quoteDate, setQuoteDate] = useState(todayIso);
  const [validUntil, setValidUntil] = useState(() => futureIso(7));
  const [notes, setNotes] = useState('Prices are exclusive of shipping and any custom packaging, sleeve, stamp, or gift-box setup.');
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
              <th style={thRight}>50g Anchor</th>
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
            <strong style={{ color: '#111827' }}>Pricing rationale:</strong> The quote uses eligible 50g soap variants only. The 50g retail anchor is prorated from catalogue weight and rounded to nearest ₹5 before discounts. Mixed assortment and bulk quotations apply the tier by total enquiry quantity; standard wholesale applies the tier per SKU.
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4B5563', lineHeight: 1.55 }}>
            <strong style={{ color: '#111827' }}>Notes:</strong> {notes || 'Prices are indicative and subject to final confirmation.'}
          </div>
        </div>

        <ProductAnnexure products={activeProducts} />
      </div>
    </div>
  );
}

export default function WholesalePricingClient({ products }) {
  const [tab, setTab] = useState('quote');
  const wholesaleProducts = useMemo(() => products.filter(isWholesaleEligible), [products]);

  const excludedCount = products.length - wholesaleProducts.length;
  const retailAverage = useMemo(() => {
    if (!wholesaleProducts.length) return 0;
    return wholesaleProducts.reduce((sum, p) => sum + getWholesaleVariantPrice(p), 0) / wholesaleProducts.length;
  }, [wholesaleProducts]);

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
        <SummaryCard label="50g Variants" value={fmt(wholesaleProducts.length)} note={`${excludedCount} catalogue products excluded`} />
        <SummaryCard label="Average 50g Anchor" value={fmtCurrency(retailAverage)} note="Used only as an overview benchmark" />
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
        Wholesale quotes here are for regular 50g soap variants only. Products marked as not wholesale eligible are excluded from this report, so bundles, specialty formats, seasonal specials, travel soaps, and loofah soaps can be managed from the product catalogue instead of code. The 50g retail anchor is prorated from the catalogue price by weight, then rounded to the nearest ₹5 before wholesale discounts are applied.
      </div>

      <BaseTypePriceMatrix products={wholesaleProducts} />

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
        <PricingTable products={wholesaleProducts} tiers={STANDARD_TIERS} mode="standard" />
      )}

      {tab === 'quote' && (
        <QuotationBuilder products={products} />
      )}

      {tab === 'mixed' && (
        <div>
          <div style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.55, marginBottom: '14px' }}>
            Mixed assortment uses the same unit prices as standard wholesale, but the MOQ can be reached across multiple products instead of 50, 100, or 150 units of a single SKU.
          </div>
          <PricingTable products={wholesaleProducts} tiers={STANDARD_TIERS} mode="mixed" />
        </div>
      )}

      {tab === 'bulk' && (
        <PricingTable products={wholesaleProducts} tiers={BULK_TIERS} mode="bulk" />
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
