'use client';

import { useState } from 'react';

// Occasion seal queue, separate from the product batch queue — each entry
// is a message + which preset (if any) it came from, not a product. Keyed
// by `key` (a preset's id, or `custom:<text>` for a free-typed message) so
// re-adding the same preset/text bumps its qty instead of creating a
// duplicate queue entry. Fully independent of the mini/premium batch
// queue's printMode/fragranceFree concerns — this is its own subsystem.
export function useSealQueue() {
  const [sealBatches, setSealBatches] = useState([]);
  const [sealMessage, setSealMessage] = useState('');

  const bumpSealBatch = (prev, key, seedFields, amount) => {
    const idx = prev.findIndex((b) => b.key === key);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + amount };
      return next;
    }
    return [...prev, { id: `${key}-${Date.now()}`, key, qty: amount, ...seedFields }];
  };

  const addPresetSeal = (preset) =>
    setSealBatches((prev) => bumpSealBatch(prev, preset.id, { message: preset.message, iconId: preset.id }, 1));

  const addCustomSeal = () => {
    const msg = sealMessage.trim();
    if (!msg) return;
    setSealBatches((prev) => bumpSealBatch(prev, `custom:${msg}`, { message: msg, iconId: 'custom' }, 1));
    setSealMessage('');
  };

  const dropOneSeal = (prev, idx) => {
    if (prev[idx].qty <= 1) return prev.filter((_, i) => i !== idx);
    const next = [...prev];
    next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
    return next;
  };

  // Click the × on a printed seal in the sheet → remove that exact one.
  const removeOneSealFromQueue = (sealId) => {
    setSealBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === sealId);
      return idx === -1 ? prev : dropOneSeal(prev, idx);
    });
  };

  const removeSealBatch = (id) => setSealBatches((prev) => prev.filter((b) => b.id !== id));
  const clearAllSeals = () => setSealBatches([]);

  return {
    sealBatches,
    sealMessage,
    setSealMessage,
    addPresetSeal,
    addCustomSeal,
    removeOneSealFromQueue,
    removeSealBatch,
    clearAllSeals,
  };
}
