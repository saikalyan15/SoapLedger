'use client';

import { useState } from 'react';
import { computeWeightedCounts } from '../logic';

// Body-care sticker queue, separate from the soap batch queue and the seal
// queue — keyed directly by the static catalog's `id` (see
// bodyCareProducts.jsx) since every entry already comes from that fixed
// list, with no "custom" variant to key around. Takes the catalog itself
// (`items`) so fillSheetEvenly below can spread across it, same shape as
// useProductBatchQueue(printMode, products).
export function useBodyCareQueue(items) {
  const [bodyCareBatches, setBodyCareBatches] = useState([]);

  const bumpBodyCareItem = (prev, item, amount) => {
    const idx = prev.findIndex((b) => b.id === item.id);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + amount };
      return next;
    }
    return [...prev, { ...item, qty: amount }];
  };

  const addBodyCareItem = (item) => setBodyCareBatches((prev) => bumpBodyCareItem(prev, item, 1));

  // Click the × on a printed sticker in the sheet → remove that exact one.
  const removeOneBodyCareItem = (id) =>
    setBodyCareBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      if (prev[idx].qty <= 1) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
      return next;
    });

  const removeBodyCareBatch = (id) => setBodyCareBatches((prev) => prev.filter((b) => b.id !== id));
  const clearAllBodyCare = () => setBodyCareBatches([]);

  // One-click "fill sheet" — spreads the remaining sheet space across every
  // catalog product instead of clicking each one by hand. Reuses
  // computeWeightedCounts (same math as the product batch queue's
  // fillSheetEvenly); these static items carry no `units_sold`, so every
  // weight defaults to the same +1 smoothing and the split comes out even.
  const fillBodyCareSheetEvenly = (freeOnLastPage, labelsPerPage, totalLabels) => {
    const target = totalLabels === 0 ? labelsPerPage : freeOnLastPage;
    if (target <= 0 || items.length === 0) return;

    const counts = computeWeightedCounts(items, target);
    setBodyCareBatches((prev) => items.reduce((acc, item, i) => bumpBodyCareItem(acc, item, counts[i]), prev));
  };

  return {
    bodyCareBatches,
    addBodyCareItem,
    removeOneBodyCareItem,
    removeBodyCareBatch,
    clearAllBodyCare,
    fillBodyCareSheetEvenly,
  };
}
