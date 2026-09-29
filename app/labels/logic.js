// Pure, framework-free logic for the labels page — no React, no state, no
// side effects. Kept separate from the components/hooks that call it so it
// can be unit-tested directly (see logic.test.js) without rendering
// anything, and so it stays the one place this math lives instead of being
// duplicated per label type.

// Product names were authored with the base type baked in (e.g. "Neem Tulsi
// Glycerin Soap"), which reads redundant next to the base_type shown right
// below it — so it's stripped from the title. \s* (not \s+) so it matches
// both "Shea Butter" and the no-space "Sheabutter" some product names use;
// the trailing "e?" on glycerine matches both "Glycerin" and "Glycerine"
// spellings.
export const BASE_NAME_PATTERNS = {
  Glycerine: /\bglycerine?\b/gi,
  'Goat Milk': /\bgoat\s*milk\b/gi,
  'Shea Butter': /\bshea\s*butter\b/gi,
  'Red Wine': /\bred\s*wine\b/gi,
  Loofah: /\bloofah\b/gi,
};

export function getDisplayName(productName, baseType) {
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

// The mini sticker has to physically fit in the wrapper band's clear space
// (~36x7.6mm on the 50g band — see MINI_LABEL_SIZE_MM), which is too small
// to show a full legal ingredient declaration at any legible size. Always
// use the short, purpose-written "Mini Sticker Description" field — no
// code-side attempt to stitch a summary out of the ingredients list; that's
// editorial content, not something to derive. A product without one
// authored yet just shows a plain placeholder until someone writes it.
export function getMiniLabelDescription(label) {
  return label.mini_label_description?.trim() || 'Handmade soap';
}

// Ingredients is free text (comma-separated), authored per product — not a
// structured list — so a fragrance-free copy is produced by dropping any
// comma-separated segment that mentions "essential oil" (however it's named
// — "Tulsi Essential Oil", "Essential Oil Blend", etc.) rather than
// requiring a second, separately-maintained ingredients field per product.
export function stripFragrance(ingredients) {
  if (!ingredients) return ingredients;
  return ingredients
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/essential oil/i.test(part))
    .join(', ');
}

// One-click "fill sheet" math: spread `target` labels across `products`,
// weighted by all-time units sold (products.units_sold, from order_items)
// so frequently-sold soaps get more labels than slow movers, not an even
// split. +1 smoothing per product so a brand-new product with zero sales
// still gets a small share instead of none. Returns a `counts` array
// parallel to `products`, always summing to exactly `target` via the
// largest-remainder method (leftover slots lost to flooring go to whichever
// products lost the most, so the total lands exactly on `target` while
// staying as proportional as possible).
export function computeWeightedCounts(products, target) {
  if (target <= 0 || products.length === 0) return products.map(() => 0);

  const weights = products.map((p) => (p.units_sold || 0) + 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const raw = weights.map((w) => (target * w) / totalWeight);
  const counts = raw.map(Math.floor);
  const shortfall = target - counts.reduce((sum, n) => sum + n, 0);

  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < shortfall; k++) {
    counts[byRemainder[k % byRemainder.length].i] += 1;
  }

  return counts;
}

// Chunk the flat label queue into print-page-sized slices, and report how
// full the last page is — surfaced as a capacity meter + ghost slots so
// it's obvious how many more labels are needed to avoid wasting a
// partially-filled sheet of (expensive) adhesive paper.
export function computePagination(queue, labelsPerPage) {
  const pages = [];
  for (let i = 0; i < queue.length; i += labelsPerPage) {
    pages.push(queue.slice(i, i + labelsPerPage));
  }
  const lastPageCount = pages.length ? pages[pages.length - 1].length : 0;
  const freeOnLastPage = pages.length ? labelsPerPage - lastPageCount : 0;
  return { pages, totalLabels: queue.length, lastPageCount, freeOnLastPage };
}
