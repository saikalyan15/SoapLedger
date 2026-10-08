'use client';

import { useState } from 'react';

// Body-care sticker queue, separate from the soap batch queue and the seal
// queue — keyed directly by the static catalog's `id` (see
// bodyCareProducts.jsx) since every entry already comes from that fixed
// list, with no "custom" variant to key around.
export function useBodyCareQueue() {
  const [bodyCareBatches, setBodyCareBatches] = useState([]);

  const addBodyCareItem = (item) =>
    setBodyCareBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === item.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...item, qty: 1 }];
    });

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

  return {
    bodyCareBatches,
    addBodyCareItem,
    removeOneBodyCareItem,
    removeBodyCareBatch,
    clearAllBodyCare,
  };
}
