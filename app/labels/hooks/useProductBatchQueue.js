'use client';

import { useState } from 'react';
import { computeWeightedCounts } from '../logic';

// Mini and premium share this one queue subsystem rather than being two
// independent ones — that's a real fact about this feature, not something
// to paper over. Premium keeps its own queue, separate from mini's
// `batches`, so quantities queued in one mode don't silently bleed into
// the other when you switch modes; which queue is "active" is selected by
// `printMode`.
export function useProductBatchQueue(printMode, products) {
  // Each batch: { id, product_id, product_name, base_type, weight_grams, ingredients, mini_label_description, fragranceFree, qty }
  const [batches, setBatches] = useState([]);
  const [premiumBatches, setPremiumBatches] = useState([]);
  // Which variant `addOne`/`addQuantityToAll` add to next, premium only —
  // a couple of customers are sensitive to fragrance, so a run can mix
  // regular and fragrance-free copies of the same product. Toggle before
  // adding, since a product's palette chip only shows one running total.
  const [fragranceFreeMode, setFragranceFreeMode] = useState(false);
  // Bulk-seed amount, used only by the "Add to all" button below the
  // product palette — per-product fine-tuning happens by clicking a chip
  // (add one) or the × on a printed label in the sheet (remove one).
  const [quantity, setQuantity] = useState(1);

  // Premium reads/writes its own queue; every other batch-backed mode
  // (currently just mini) keeps using `batches`.
  const activeBatches = printMode === 'premium' ? premiumBatches : batches;
  const setActiveBatches = printMode === 'premium' ? setPremiumBatches : setBatches;

  // Keyed by (product_id, fragranceFree) rather than product_id alone, so
  // premium can carry a regular and a fragrance-free queue entry for the
  // same product side by side instead of one overwriting the other.
  const bumpBatch = (prev, product, amount, fragranceFree = false) => {
    const idx = prev.findIndex((b) => b.product_id === product.id && !!b.fragranceFree === fragranceFree);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + amount };
      return next;
    }
    return [
      ...prev,
      {
        id: `${product.id}-${fragranceFree ? 'nf-' : ''}${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        base_type: product.base_type,
        weight_grams: product.weight_grams,
        ingredients: product.ingredients,
        mini_label_description: product.mini_label_description,
        fragranceFree,
        qty: amount,
      },
    ];
  };

  // Click a product chip → one label lands on the sheet immediately, as
  // whichever variant fragranceFreeMode currently points to.
  const addOne = (product) =>
    setActiveBatches((prev) => bumpBatch(prev, product, 1, printMode === 'premium' && fragranceFreeMode));

  // Bulk-seed every product at once with the shared quantity field, for
  // starting a baseline before fine-tuning up/down per product.
  const addQuantityToAll = () => {
    setActiveBatches((prev) =>
      products.reduce((acc, p) => bumpBatch(acc, p, quantity, printMode === 'premium' && fragranceFreeMode), prev),
    );
  };

  const dropOne = (prev, idx) => {
    if (prev[idx].qty <= 1) return prev.filter((_, i) => i !== idx);
    const next = [...prev];
    next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
    return next;
  };

  // Click the × on a printed label in the sheet → remove that exact one.
  const removeOneFromBatch = (batchId) => {
    setActiveBatches((prev) => {
      const idx = prev.findIndex((b) => b.id === batchId);
      return idx === -1 ? prev : dropOne(prev, idx);
    });
  };

  // Click the − on a product chip → remove one, without hunting for it in
  // the sheet. Targets whichever variant fragranceFreeMode currently
  // points to, falling back to the other variant if that one is empty.
  const removeOneByProduct = (productId) => {
    setActiveBatches((prev) => {
      const wantNF = printMode === 'premium' && fragranceFreeMode;
      let idx = prev.findIndex((b) => b.product_id === productId && !!b.fragranceFree === wantNF);
      if (idx === -1) idx = prev.findIndex((b) => b.product_id === productId);
      return idx === -1 ? prev : dropOne(prev, idx);
    });
  };

  const removeBatch = (id) =>
    setActiveBatches((prev) => prev.filter((b) => b.id !== id));
  const clearAll = () => setActiveBatches([]);

  // One-click default: spread just enough labels across every visible
  // product to exactly fill up the sheet currently in progress (or a whole
  // fresh sheet if nothing's queued yet) — so a full page of variety is one
  // click away instead of clicking each chip by hand. `freeOnLastPage`/
  // `labelsPerPage`/`totalLabels` come from computePagination(queue, ...)
  // in the caller, since `queue` itself is built from `activeBatches` —
  // computing pagination inside this hook would be circular.
  const fillSheetEvenly = (freeOnLastPage, labelsPerPage, totalLabels) => {
    const target = totalLabels === 0 ? labelsPerPage : freeOnLastPage;
    if (target <= 0 || products.length === 0) return;

    const counts = computeWeightedCounts(products, target);
    setActiveBatches((prev) =>
      products.reduce((acc, p, i) => bumpBatch(acc, p, counts[i], printMode === 'premium' && fragranceFreeMode), prev),
    );
  };

  return {
    activeBatches,
    fragranceFreeMode,
    setFragranceFreeMode,
    quantity,
    setQuantity,
    addOne,
    addQuantityToAll,
    removeOneFromBatch,
    removeOneByProduct,
    removeBatch,
    clearAll,
    fillSheetEvenly,
  };
}
