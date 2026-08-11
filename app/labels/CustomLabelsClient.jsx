'use client';

import { Layers, Plus, Printer, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const COLORS = {
  brand: '#1B4332',
  text: '#000000',
  muted: '#4B5563',
};

// Wrapper band physical layouts, keyed by soap format. Panel widths are
// [leftTab, leftSide, front, rightSide, rightTab] in mm — the band wraps
// side-front-side around 3 of the bar's 4 faces, then the two glue tabs
// fold onto the back face and overlap each other there.
// 100g: real bar footprint is 54mm (front) x 24mm (side), 35mm tall.
// 50g square: measured bar is 40mm x 40mm (square footprint) x 20mm tall —
// front and side are equal since the footprint is a square, not a rectangle.
const BAND_SIZES = {
  '100g': {
    label: '100g Rectangle',
    panelWidths: [50, 24, 54, 24, 50],
    height: 35,
    logoWidth: 22,
  },
  '50g': {
    label: '50g Square',
    // Tabs sized to just clear the 40mm back face (25+25=50mm, ~10mm
    // overlap) rather than reusing the 100g bar's 35mm tabs, which were
    // oversized for this smaller back and wasted paper.
    panelWidths: [25, 40, 40, 40, 25],
    height: 20,
    logoWidth: 13,
  },
};

const FONTS = {
  sans: '"Plus Jakarta Sans", "Inter", Arial, sans-serif',
};

// Some products' free-text ingredients were typed with an old habit of
// spelling out "...and Glycerin soap base" at the end — now redundant since
// the base is always injected as its own leading ingredient below. Built
// from the product's own base_type (not a fixed list) so it strips
// correctly no matter what base_type gets typed on the Products page; the
// trailing e? absorbs the Glycerin/Glycerine spelling variance.
function stripRedundantBasePhrase(baseType, text) {
  if (!baseType || !text) return text;
  const escaped = baseType
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s*');
  const stem = escaped.replace(/e$/i, '');
  return text.replace(new RegExp(`\\b(?:and\\s+)?${stem}e?\\s+soap\\s*base\\b`, 'gi'), '');
}

// Base type is free text on the product (Products page) — whatever's typed
// there becomes its own leading ingredient, e.g. "Papaya Cucumber Soap
// Base", so a new base_type never silently drops the base line. "Travel"
// is the one exception: travel minis don't carry a soap-base ingredient.
function getFullIngredients(baseType, additionalIngredients) {
  const base = baseType && baseType !== 'Travel' ? `${baseType} Soap Base` : '';
  const cleanedAdditional = stripRedundantBasePhrase(baseType, additionalIngredients)
    ?.replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .trim();
  const combined = [base, cleanedAdditional].filter(Boolean).join(', ');
  const seen = new Set();
  return combined
    .split(',')
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || seen.has(s.toLowerCase())) return false;
      seen.add(s.toLowerCase());
      return true;
    })
    .join(', ');
}

// Product names were authored with the base type baked in (e.g. "Neem Tulsi
// Glycerin Soap"), but the base now always shows up as the first ingredient
// (see getFullIngredients above) — so it's stripped from the title to avoid
// saying it twice. \s* (not \s+) so it matches both "Shea Butter" and the
// no-space "Sheabutter" some product names use; the trailing "e?" on
// glycerine matches both "Glycerin" and "Glycerine" spellings.
const BASE_NAME_PATTERNS = {
  Glycerine: /\bglycerine?\b/gi,
  'Goat Milk': /\bgoat\s*milk\b/gi,
  'Shea Butter': /\bshea\s*butter\b/gi,
  'Red Wine': /\bred\s*wine\b/gi,
  Loofah: /\bloofah\b/gi,
};

function getDisplayName(productName, baseType) {
  const pattern = BASE_NAME_PATTERNS[baseType];
  if (!pattern || !productName) return productName;
  const stripped = productName
    .replace(pattern, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '')
    .trim();
  // e.g. "Loofah Soaps" → "Soaps" — the base word was the product's actual
  // identity, not decoration on top of it. Keep the original name whenever
  // stripping it leaves nothing but a generic "Soap"/"Soaps".
  if (!stripped || /^soaps?$/i.test(stripped)) return productName;
  return stripped;
}

// Mini stickers are too small to safely show a full ingredient declaration.
// Prefer purpose-written copy. Until a product is given one, create a compact,
// comma-aware ingredient summary rather than letting the browser cut through a
// word or ingredient. The full legal ingredient declaration remains on the
// wrapper band / main packaging.
function getMiniLabelDescription(label) {
  const authored = label.mini_label_description?.trim();
  if (authored) return authored;

  const parts = getFullIngredients(label.base_type, label.ingredients)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  // “Base” retains the ingredient category while giving the constrained
  // sticker enough room to show at least one actual add-in as well.
  if (parts[0]) parts[0] = parts[0].replace(/\s+Soap\s+Base$/i, ' Base');
  const limit = 44;
  const moreSuffix = ' + more';
  let summary = '';

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const candidate = summary ? `${summary}, ${part}` : part;
    const hasMore = index < parts.length - 1;
    if (candidate.length <= limit - (hasMore ? moreSuffix.length : 0)) {
      summary = candidate;
      continue;
    }
    if (summary) return `${summary}${moreSuffix}`;

    const words = part.split(/\s+/);
    let shortened = '';
    for (const word of words) {
      const wordCandidate = shortened ? `${shortened} ${word}` : word;
      if (wordCandidate.length > limit - 1) break;
      shortened = wordCandidate;
    }
    return `${shortened || part.slice(0, limit - 1).trimEnd()}…`;
  }

  return summary || 'Handmade soap';
}

// Hover-to-reveal delete button rendered on top of a printed label, so a
// single click removes that exact instance straight from the sheet
// preview. Screen-only (no-print) — never appears in the printed output.
function RemoveLabelButton({ onRemove }) {
  return (
    <button
      type="button"
      className="no-print remove-label-btn"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      title="Remove this label"
      style={{
        position: 'absolute',
        top: '0.6mm',
        right: '0.6mm',
        zIndex: 2,
        width: '3.2mm',
        height: '3.2mm',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(220,38,38,0.92)',
        color: 'white',
        fontSize: '2.4mm',
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      ×
    </button>
  );
}

function MiniProductLabel({ label, license, onRemove }) {
  return (
    <div className="mini-label">
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '0.8mm 1mm',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: COLORS.brand,
            lineHeight: 1.1,
            textAlign: 'center',
            fontSize: label.product_name.length > 36 ? '6.5pt' : '7.5pt',
          }}
        >
          {getDisplayName(label.product_name, label.base_type)}
        </div>

        <div
          style={{
            width: '55%',
            alignSelf: 'center',
            borderBottom: `0.15mm solid ${COLORS.brand}`,
            opacity: 0.3,
            margin: '0.3mm 0',
          }}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: '6pt',
              fontWeight: 500,
              color: COLORS.text,
              lineHeight: 1.2,
              letterSpacing: '0.03em',
              overflowWrap: 'anywhere',
            }}
          >
            {getMiniLabelDescription(label)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SoapBand({ license, size = BAND_SIZES['100g'] }) {
  const [tabL, sideL, front, sideR, tabR] = size.panelWidths;
  const totalWidth = tabL + sideL + front + sideR + tabR;

  return (
    <div className="soap-band-container">
      {/* Cutting guidelines — thin dashed line for print, text for screen */}
      <div className="cutting-guide">
        <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
        <span className="no-print" style={{ fontSize: '10px', color: '#999', padding: '0 8px' }}>Cut Line</span>
        <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
      </div>

      <div
        className="soap-band"
        style={{ width: `${totalWidth}mm`, height: `${size.height}mm` }}
      >
        {/* Notice: No white background overlay. We want the kraft paper to show through the background image natively */}

        <div
          className="band-grid"
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            gridTemplateColumns: `${tabL}mm ${sideL}mm ${front}mm ${sideR}mm ${tabR}mm`,
          }}
        >
          {/* Panel 1: Left glue tab — overlaps on back */}
          <div
            className="band-panel"
            style={{
              padding: '2mm',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
            }}
          >
            <span style={{ fontSize: '5pt', color: COLORS.muted }}>
              healingsoil.in
            </span>
          </div>

          {/* Panel 2: Left side */}
          <div className="band-panel" />

          {/* Panel 3: Front face */}
          <div
            className="band-panel"
            style={{
              padding: '1.5mm 2mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'center',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Logo at Top — safely away from cut line */}
            <img
              src="/logo/healing-soil-v2.1.png"
              style={{ width: `${size.logoWidth}mm`, height: 'auto' }}
            />

            {/* Clear space for sticker in middle */}
            <div style={{ flex: 1 }}></div>

            {/* Udyam at Bottom — safely away from cut line */}
            <div
              style={{
                fontSize: '5pt',
                fontWeight: 800,
                color: COLORS.text,
                letterSpacing: '0.05em',
                padding: '0.1mm 1mm',
              }}
            >
              {license}
            </div>
          </div>

          {/* Panel 4: Right side */}
          <div className="band-panel" />

          {/* Panel 5: Right glue tab — overlaps on back */}
          <div className="band-panel" />
        </div>
      </div>

      {/* Print-only cutting guides */}
      <div className="print-guide only-print"></div>
    </div>
  );
}

function AddressSticker({ address, brandName, onRemove }) {
  return (
    <div className="address-sticker">
      {onRemove && <RemoveLabelButton onRemove={onRemove} />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '2.5mm 3mm',
          boxSizing: 'border-box',
        }}
      >
        {/* FROM tag + brand name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
          <span
            style={{
              display: 'inline-block',
              background: COLORS.brand,
              color: 'white',
              fontWeight: 800,
              fontSize: '6.5pt',
              letterSpacing: '0.1em',
              borderRadius: '0.8mm',
              padding: '0.4mm 1.5mm',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            FROM
          </span>
          <div style={{ flex: 1, borderTop: `0.2mm solid ${COLORS.brand}`, opacity: 0.4 }} />
          <span style={{ fontSize: '6.5pt', fontWeight: 700, color: COLORS.brand, whiteSpace: 'nowrap' }}>
            {brandName}
          </span>
        </div>

        {/* Sender name */}
        <div style={{ fontSize: '11pt', fontWeight: 800, color: COLORS.text, lineHeight: 1.15 }}>
          {address.name}
        </div>

        {/* Address lines */}
        <div style={{ fontSize: '8.5pt', color: COLORS.text, lineHeight: 1.35, fontWeight: 500 }}>
          {address.line1}<br />
          {address.line2}<br />
          {address.line3}<br />
          {address.cityStateZip}
        </div>

        {/* Phone */}
        <div style={{ fontSize: '9pt', fontWeight: 700, color: COLORS.text }}>
          Ph: {address.phone}
        </div>
      </div>
    </div>
  );
}

// These product lines don't get individual labels printed (gift/seasonal
// bundles, kids sets, discovery boxes, and travel minis are packaged and
// labeled differently) — keep them out of the label palette entirely.
const EXCLUDED_FROM_LABELS = [/valentine/i, /\bkids\b/i, /discovery box/i, /\btravel\b/i, /gift.*pouch/i];

export default function CustomLabelsClient({ products: allProducts, businessConfig }) {
  const products = allProducts.filter(
    (p) => !EXCLUDED_FROM_LABELS.some((re) => re.test(p.name)),
  );

  // Each batch: { id, product_id, product_name, base_type, weight_grams, ingredients, mini_label_description, qty }
  const [batches, setBatches] = useState([]);
  // Bulk-seed amount, used only by the "Add to all" button below the
  // product palette — per-product fine-tuning happens by clicking a chip
  // (add one) or the × on a printed label in the sheet (remove one).
  const [quantity, setQuantity] = useState(1);
  const [printMode, setPrintMode] = useState('bands'); // 'bands' | 'mini' | 'address'
  const [bandPages, setBandPages] = useState(1);
  const [bandSize, setBandSize] = useState('100g'); // '100g' | '50g'
  const [addressCount, setAddressCount] = useState(21);

  // Mini: 38.1x14mm (widened from 0.5in to fit larger ingredient text),
  // 7x14 grid (landscape, edge-to-edge).
  // Bands: 35mm-tall 100g bands fit 8 per sheet; 20mm-tall 50g bands fit 14.
  // Address: 62x36mm, 3x7 grid, 21 per sheet (8mm padding + 3mm gaps:
  // 7*36 + 6*3 = 270mm fits inside the 281mm usable height of a 297mm-tall
  // A4 page).
  const bandsPerPage = bandSize === '50g' ? 14 : 8;
  const labelsPerPage =
    printMode === 'mini' ? 98 : printMode === 'address' ? 21 : bandsPerPage;

  const bumpBatch = (prev, product, amount) => {
    const idx = prev.findIndex((b) => b.product_id === product.id);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + amount };
      return next;
    }
    return [
      ...prev,
      {
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        base_type: product.base_type,
        weight_grams: product.weight_grams,
        ingredients: product.ingredients,
        mini_label_description: product.mini_label_description,
        qty: amount,
      },
    ];
  };

  // Click a product chip → one label lands on the sheet immediately.
  const addOne = (product) => setBatches((prev) => bumpBatch(prev, product, 1));

  // Bulk-seed every product at once with the shared quantity field, for
  // starting a baseline before fine-tuning up/down per product.
  const addQuantityToAll = () => {
    setBatches((prev) => products.reduce((acc, p) => bumpBatch(acc, p, quantity), prev));
  };

  const dropOne = (prev, idx) => {
    if (prev[idx].qty <= 1) return prev.filter((_, i) => i !== idx);
    const next = [...prev];
    next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
    return next;
  };

  // Click the × on a printed label in the sheet → remove that exact one.
  const removeOneFromBatch = (batchId) => {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === batchId);
      return idx === -1 ? prev : dropOne(prev, idx);
    });
  };

  // Click the − on a product chip → remove one, without hunting for it in the sheet.
  const removeOneByProduct = (productId) => {
    setBatches((prev) => {
      const idx = prev.findIndex((b) => b.product_id === productId);
      return idx === -1 ? prev : dropOne(prev, idx);
    });
  };

  const removeBatch = (id) =>
    setBatches((prev) => prev.filter((b) => b.id !== id));
  const clearAll = () => setBatches([]);

  // Expand batches into flat label list for the print grid
  const queue = useMemo(() => {
    if (printMode === 'bands') {
      // For bands, we just fill the requested number of pages
      return Array.from({ length: bandPages * bandsPerPage }, (_, i) => ({ uid: `band-${i}` }));
    }
    if (printMode === 'address') {
      // Every sticker is identical (the sender's own address), so there's
      // no per-product palette here — just a flat count to fill.
      return Array.from({ length: addressCount }, (_, i) => ({ uid: `addr-${i}` }));
    }
    return batches.flatMap((b) =>
      Array.from({ length: b.qty }, (_, i) => ({ uid: `${b.id}-${i}`, ...b })),
    );
  }, [batches, printMode, bandPages, bandsPerPage, addressCount]);

  const totalLabels = queue.length;

  const pages = [];
  for (let i = 0; i < queue.length; i += labelsPerPage) {
    pages.push(queue.slice(i, i + labelsPerPage));
  }

  // How full the last page is — surfaced as a capacity meter + ghost slots
  // so it's obvious how many more labels are needed to avoid wasting a
  // partially-filled sheet of (expensive) adhesive paper.
  const lastPageCount = pages.length ? pages[pages.length - 1].length : 0;
  const freeOnLastPage = pages.length ? labelsPerPage - lastPageCount : 0;

  // One-click default: spread just enough labels across every visible
  // product to exactly fill up the sheet currently in progress (or a whole
  // fresh sheet if nothing's queued yet) — so a full page of variety is one
  // click away instead of clicking each chip by hand. Weighted by all-time
  // units sold (products.units_sold, from order_items) so frequently-sold
  // soaps get more labels than slow movers, not an even split. +1 smoothing
  // per product so a brand-new product with zero sales still gets a small
  // share instead of none.
  const fillSheetEvenly = () => {
    const target = totalLabels === 0 ? labelsPerPage : freeOnLastPage;
    if (target <= 0 || products.length === 0) return;

    const weights = products.map((p) => (p.units_sold || 0) + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const raw = weights.map((w) => (target * w) / totalWeight);
    const counts = raw.map(Math.floor);
    const shortfall = target - counts.reduce((sum, n) => sum + n, 0);

    // Largest-remainder method: hand the leftover slots (lost to flooring)
    // to whichever products lost the most, so the total still lands
    // exactly on `target` while staying as proportional as possible.
    const byRemainder = raw
      .map((r, i) => ({ i, frac: r - Math.floor(r) }))
      .sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < shortfall; k++) {
      counts[byRemainder[k % byRemainder.length].i] += 1;
    }

    setBatches((prev) =>
      products.reduce((acc, p, i) => bumpBatch(acc, p, counts[i]), prev),
    );
  };

  // Per-mode sheet layout — mini prints landscape, edge-to-edge, centered on the page.
  const sheetLayoutStyle =
    printMode === 'mini'
      ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 38.1mm)',
          gridAutoRows: '14mm',
          gap: 0,
          justifyContent: 'center',
          alignContent: 'center',
          padding: '5mm',
          width: '297mm',
          height: '210mm',
        }
      : printMode === 'address'
      ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 62mm)',
          gap: '3mm',
          justifyContent: 'center',
          alignContent: 'start',
          padding: '8mm',
          width: '210mm',
          height: 'auto',
          minHeight: '297mm',
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2mm',
          padding: '8mm 0 0',
          width: '210mm',
          height: 'auto',
          minHeight: '297mm',
        };

  return (
    <div className="labels-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @page {
          size: A4 ${printMode === 'mini' ? 'landscape' : 'portrait'};
          margin: 0;
        }
        .labels-page {
          background: #f0ede8;
          padding: 20px;
          min-height: 100vh;
          font-family: ${FONTS.sans};
        }

        .mini-label {
          width: 38.1mm;
          height: 14mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background: transparent;
        }

        .address-sticker {
          width: 62mm;
          height: 36mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background: white;
        }

        /* Remove-on-hover: the × only shows while hovering a printed label,
           so the sheet preview stays clean until you're pointing at the
           exact one you want to pull off. */
        .remove-label-btn {
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .mini-label:hover .remove-label-btn,
        .address-sticker:hover .remove-label-btn {
          opacity: 1;
        }

        .soap-band-container {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .soap-band {
          width: 202mm;
          height: 35mm;
          border: 0.1mm dashed #999;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background-image: url('/label-bg.png');
          background-size: cover;
          background-position: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .cutting-guide {
          width: 100%;
          max-width: 210mm;
          display: flex;
          align-items: center;
          padding: 8px 0;
        }

        .band-grid {
          display: grid;
          grid-template-columns: 50mm 24mm 54mm 24mm 50mm;
          height: 100%;
          align-items: stretch;
        }
        .band-panel:nth-child(2),
        .band-panel:nth-child(3) {
          border-right: 1px dashed rgba(0, 0, 0, 0.5);
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block;
          }
          .page-separator {
            display: none !important;
          }
          .labels-page {
            background: white !important;
            padding: 0 !important;
            min-height: 0 !important;
          }

          /* This wrapper caps the on-screen editing UI to a comfortable
             reading width (860px). Left un-reset for print, it also
             squeezes the print sheets themselves — harmless for the
             210mm-wide portrait sheets (narrower than 860px/227.7mm) but
             it clips the 297mm-wide landscape Mini Sticker sheet, whose
             own auto-margin centering can't work inside a container
             narrower than itself. Every sheet must center against the
             full physical page, not this reading-width box. */
          .labels-content-wrap {
            max-width: none !important;
            margin: 0 !important;
          }

          .mini-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(7, 38.1mm) !important;
            grid-auto-rows: 14mm !important;
            gap: 0 !important;
            justify-content: center !important;
            align-content: center !important;
            padding: 5mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
            width: 297mm !important;
            height: 210mm !important;
            box-sizing: border-box !important;
          }
          .mini-page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .address-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(3, 62mm) !important;
            gap: 3mm !important;
            justify-content: center !important;
            align-content: start !important;
            padding: 8mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
          }
          .address-page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .band-page-sheet {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            /* 6mm top clears printer hardware margins; 8 x 35mm (100g) or
               14 x 20mm (50g) bands both total 280mm, leaving ~11mm at the
               bottom of the 297mm page */
            padding: 6mm 0 0 !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always;
            break-after: page;
            gap: 0 !important;
            overflow: hidden !important;
          }
          .band-page-sheet:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Each band prints its own dashed border, which is the cut line —
             the extra guide rows would push the stack past 297mm */
          .cutting-guide {
            display: none !important;
          }

          .mini-label {
            width: 38.1mm !important;
            height: 14mm !important;
            /* Cut lines: every label keeps its own dashed border so, tiled
               edge-to-edge with zero gap, adjoining borders form a full
               cutting grid across the whole sheet. */
            border: 0.1mm dashed #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }

          .address-sticker {
            width: 62mm !important;
            height: 36mm !important;
            border: 0.1mm dashed #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
          }

          .soap-band-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .soap-band {
            border: 0.1mm dashed #999 !important;
            margin-bottom: 0 !important;
          }
          
          .soap-band-container:last-child .soap-band {
             /* preserve bottom border for the last one */
          }

          .print-guide {
            width: 100%;
            height: 0;
            border-top: 0.1mm dashed #000;
            position: absolute;
            left: 0;
            right: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Slim control bar */}
      <div
        className="no-print"
        style={{
          maxWidth: '860px',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: '8px', padding: '3px', gap: '2px' }}>
          <button
            onClick={() => setPrintMode('bands')}
            style={{
              background: printMode === 'bands' ? COLORS.brand : 'transparent',
              color: printMode === 'bands' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Wrapper Bands
          </button>
          <button
            onClick={() => setPrintMode('mini')}
            style={{
              background: printMode === 'mini' ? COLORS.brand : 'transparent',
              color: printMode === 'mini' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Mini Stickers
          </button>
          <button
            onClick={() => setPrintMode('address')}
            style={{
              background: printMode === 'address' ? COLORS.brand : 'transparent',
              color: printMode === 'address' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            From Address
          </button>
        </div>

        {/* Bands: soap size sub-toggle (defaults to the original 100g layout) */}
        {printMode === 'bands' && (
          <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {Object.entries(BAND_SIZES).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setBandSize(key)}
                style={{
                  background: bandSize === key ? COLORS.brand : 'transparent',
                  color: bandSize === key ? 'white' : COLORS.muted,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONTS.sans,
                  whiteSpace: 'nowrap',
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        )}

        {/* Bands: page count inline */}
        {printMode === 'bands' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: COLORS.muted, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>Pages:</label>
            <input
              type="number"
              min={1}
              max={20}
              value={bandPages}
              onChange={(e) => setBandPages(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              style={{
                width: '60px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                fontFamily: FONTS.sans,
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>{totalLabels} bands</span>
          </div>
        )}

        {/* Address: flat sticker count — every sticker is identical (the
            sender's own return address), so there's no per-product palette,
            just how many to print. */}
        {printMode === 'address' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: COLORS.muted, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>Stickers:</label>
            <input
              type="number"
              min={1}
              max={200}
              value={addressCount}
              onChange={(e) => setAddressCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
              style={{
                width: '60px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                fontFamily: FONTS.sans,
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>
              {totalLabels} sticker{totalLabels !== 1 ? 's' : ''} · {pages.length} page{pages.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Mini: bulk-seed qty + running capacity readout */}
        {printMode === 'mini' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', color: COLORS.muted, fontFamily: FONTS.sans, whiteSpace: 'nowrap' }}>Add</label>
            <input
              type="number"
              min={1}
              max={200}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontFamily: FONTS.sans, boxSizing: 'border-box' }}
            />
            <button
              onClick={addQuantityToAll}
              disabled={products.length === 0}
              title="Seed every product with this quantity to start — then click a product below to add one, or click × on a label in the sheet to remove one"
              style={{
                padding: '6px 14px',
                background: products.length > 0 ? COLORS.brand : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: products.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONTS.sans,
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} /> to all
            </button>
            <button
              onClick={fillSheetEvenly}
              disabled={!(products.length > 0 && (totalLabels === 0 || freeOnLastPage > 0))}
              title="Fill up the current sheet, weighted toward your best-selling products"
              style={{
                padding: '6px 14px',
                background: products.length > 0 && (totalLabels === 0 || freeOnLastPage > 0) ? '#2563EB' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: products.length > 0 && (totalLabels === 0 || freeOnLastPage > 0) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONTS.sans,
                whiteSpace: 'nowrap',
              }}
            >
              <Layers size={14} /> Fill sheet
            </button>
            {batches.length > 0 && (
              <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>
                {totalLabels} label{totalLabels !== 1 ? 's' : ''} · {pages.length} page{pages.length !== 1 ? 's' : ''}
                {' · '}
                {freeOnLastPage === 0 ? (
                  <span style={{ color: COLORS.brand, fontWeight: 700 }}>last page full</span>
                ) : (
                  <span>
                    {lastPageCount}/{labelsPerPage} on last page —{' '}
                    <span style={{ color: '#B45309', fontWeight: 700 }}>{freeOnLastPage} free</span>
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Print button — pushed to right */}
        <button
          onClick={() => window.print()}
          disabled={totalLabels === 0}
          style={{
            marginLeft: 'auto',
            background: totalLabels === 0 ? '#E5E7EB' : COLORS.brand,
            color: totalLabels === 0 ? '#9CA3AF' : 'white',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '7px',
            fontWeight: 700,
            cursor: totalLabels === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontFamily: FONTS.sans,
          }}
        >
          <Printer size={15} /> Print ({totalLabels})
        </button>
      </div>

      <div className="labels-content-wrap" style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Product palette — click a product to add one label to the sheet
            instantly. Remove one at a time by hovering a printed label
            below and clicking its ×, or clear a whole product with the
            trash icon in the batch summary underneath. */}
        {printMode === 'mini' && (
          <div className="no-print" style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: FONTS.sans }}>
                Products — click to add one
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {products.map((p) => {
                const queued = batches.find((b) => b.product_id === p.id);
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '20px',
                      border: `1px solid ${queued ? COLORS.brand : '#E5E7EB'}`,
                      background: queued ? '#D8F3DC' : 'white',
                      fontFamily: FONTS.sans,
                    }}
                  >
                    {queued && (
                      <button
                        type="button"
                        onClick={() => removeOneByProduct(p.id)}
                        title="Remove one"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: COLORS.brand,
                          fontWeight: 800,
                          fontSize: '15px',
                          lineHeight: 1,
                          width: '20px',
                          height: '20px',
                          marginLeft: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        −
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => addOne(p)}
                      title="Add one"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px 5px 8px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        fontFamily: FONTS.sans,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {queued && (
                        <span style={{ background: COLORS.brand, color: 'white', borderRadius: '10px', padding: '1px 6px', fontWeight: 800, fontSize: '11px' }}>
                          {queued.qty}
                        </span>
                      )}
                      <span style={{ fontWeight: queued ? 700 : 500, color: queued ? COLORS.brand : COLORS.text }}>
                        {p.name}
                      </span>
                      <Plus size={12} style={{ opacity: 0.5, color: queued ? COLORS.brand : COLORS.muted }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mini batch list — compact */}
        {printMode === 'mini' && batches.length > 0 && (
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {batches.map((batch) => (
              <div
                key={batch.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '4px 10px 4px 6px',
                  fontSize: '12px',
                  fontFamily: FONTS.sans,
                }}
              >
                <span style={{ background: COLORS.brand, color: 'white', borderRadius: '12px', padding: '1px 7px', fontWeight: 800, fontSize: '11px' }}>{batch.qty}</span>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{batch.product_name}</span>
                <button onClick={() => removeBatch(batch.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0', lineHeight: 1, display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button onClick={clearAll} style={{ background: 'none', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
              Clear all
            </button>
          </div>
        )}

        {/* A4 page preview + print output */}
        {pages.map((page, pageIdx) => (
          <div key={pageIdx}>
            {/* Page header — screen only */}
            <div
              className="page-separator no-print"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                Page {pageIdx + 1} of {pages.length} — {page.length} {printMode === 'bands' ? 'bands' : 'labels'}
              </div>
              <div style={{ flex: 1, height: '1px', background: '#D1D5DB' }} />
            </div>

            {/* A4 sheet — white card in browser, actual print page when printing */}
            <div
              className={
                printMode === 'mini'
                  ? 'mini-page-sheet'
                  : printMode === 'address'
                  ? 'address-page-sheet'
                  : 'band-page-sheet'
              }
              style={{
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                margin: '0 auto 32px auto',
                boxSizing: 'border-box',
                ...sheetLayoutStyle,
              }}
            >
              {page.map((label) =>
                printMode === 'mini' ? (
                  <MiniProductLabel
                    key={label.uid}
                    label={label}
                    license={businessConfig.brand.license}
                    onRemove={() => removeOneFromBatch(label.id)}
                  />
                ) : printMode === 'address' ? (
                  <AddressSticker
                    key={label.uid}
                    address={businessConfig.returnAddress}
                    brandName={businessConfig.brand.name}
                    onRemove={() => setAddressCount((c) => Math.max(0, c - 1))}
                  />
                ) : (
                  <SoapBand
                    key={label.uid}
                    license={businessConfig.brand.license}
                    size={BAND_SIZES[bandSize]}
                  />
                ),
              )}
              {/* Screen-only ghost slots for the remaining empty space on the last
                  page — shows exactly how many more labels are needed to avoid
                  printing (and wasting) a partially-filled sheet. Never printed. */}
              {(printMode === 'mini' || printMode === 'address') &&
                pageIdx === pages.length - 1 &&
                Array.from({ length: freeOnLastPage }, (_, i) => (
                  <div
                    key={`ghost-${i}`}
                    className={`no-print ${printMode === 'mini' ? 'mini-label' : 'address-sticker'}`}
                    style={{
                      background: 'transparent',
                      backgroundImage: 'none',
                      border: '1px dashed #E5E7EB',
                    }}
                  />
                ))}
              {/* Final cutting guide for the bottom edge — screen-only text, print-only line */}
              {printMode === 'bands' && (
                <div className="cutting-guide" style={{ marginTop: '-8px' }}>
                  <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
                  <span className="no-print" style={{ fontSize: '10px', color: '#999', padding: '0 8px' }}>Bottom Edge</span>
                  <div style={{ height: '1px', flex: 1, borderTop: '0.1mm dashed #999' }}></div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {totalLabels === 0 && (
          <div
            className="no-print"
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: COLORS.muted,
              fontSize: '14px',
            }}
          >
            <Tag
              size={40}
              style={{
                opacity: 0.2,
                marginBottom: '12px',
                display: 'block',
                margin: '0 auto 12px',
              }}
            />
            {printMode === 'bands'
              ? 'Add pages to see the wrapper bands preview.'
              : printMode === 'address'
              ? 'Set a sticker count above to fill the sheet.'
              : 'Click a product above to add it to the sheet.'}
          </div>
        )}
      </div>
    </div>
  );
}
