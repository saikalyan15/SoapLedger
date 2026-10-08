'use client';

import { Layers, Plus, Printer, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  COLORS,
  FONTS,
  BAND_SIZES,
  MINI_LABEL_SIZE_MM,
  MINI_LABEL_GRID,
  PREMIUM_LABEL_SIZE_MM,
  PREMIUM_LABEL_GRID,
  SEAL_SIZE_MM,
  SEAL_GRID,
  ADDRESS_LABEL_SIZE_MM,
  ADDRESS_LABEL_GRID,
  BODY_CARE_STICKER_SIZE_MM,
  BODY_CARE_STICKER_GRID,
  EXCLUDED_FROM_LABELS,
} from './constants';
import { computePagination } from './logic';
import { getPrintStyles } from './printStyles';
import { OCCASION_PRESETS } from './components/occasionPresets';
import { BODY_CARE_PRODUCTS } from './components/bodyCareProducts';
import { OccasionSealLabel } from './components/OccasionSealLabel';
import { BodyCareStickerLabel } from './components/BodyCareStickerLabel';
import { AddressSticker } from './components/AddressSticker';
import { SoapBand } from './components/SoapBand';
import { MiniProductLabel } from './components/MiniProductLabel';
import { PremiumProductLabel } from './components/PremiumProductLabel';
import { useSealQueue } from './hooks/useSealQueue';
import { useBodyCareQueue } from './hooks/useBodyCareQueue';
import { useProductBatchQueue } from './hooks/useProductBatchQueue';

export default function CustomLabelsClient({ products: allProducts, businessConfig }) {
  const products = allProducts.filter(
    (p) => !EXCLUDED_FROM_LABELS.some((re) => re.test(p.name)),
  );

  const [printMode, setPrintMode] = useState('bands'); // 'bands' | 'mini' | 'address' | 'premium' | 'seal' | 'bodycare'
  const [bandPages, setBandPages] = useState(1);
  const [bandSize, setBandSize] = useState('100g'); // '100g' | '50g'
  const [addressCount, setAddressCount] = useState(21);

  const {
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
    fillSheetEvenly: fillActiveBatchesEvenly,
  } = useProductBatchQueue(printMode, products);

  const {
    sealBatches,
    sealMessage,
    setSealMessage,
    addPresetSeal,
    addCustomSeal,
    removeOneSealFromQueue,
    removeSealBatch,
    clearAllSeals,
  } = useSealQueue();

  const {
    bodyCareBatches,
    addBodyCareItem,
    removeOneBodyCareItem,
    removeBodyCareBatch,
    clearAllBodyCare,
    fillBodyCareSheetEvenly,
  } = useBodyCareQueue(BODY_CARE_PRODUCTS);

  // Mini: 40x10mm (see MINI_LABEL_SIZE_MM above), 7x21 grid on a 297x210mm
  // landscape A4 sheet (147/sheet, auto-centered — width doesn't tile
  // edge-to-edge at this size). Fits inside the 100g band's clear space but
  // not the smaller 50g band's — legibility was prioritized over that fit.
  // Bands: 35mm-tall 100g bands fit 8 per sheet; 20mm-tall 50g bands fit 14.
  // Address: 62x36mm, 3x7 grid, 21 per sheet (8mm padding + 3mm gaps:
  // 7*36 + 6*3 = 270mm fits inside the 281mm usable height of a 297mm-tall
  // A4 page).
  const bandsPerPage = bandSize === '50g' ? 14 : 8;
  const miniPerPage = MINI_LABEL_GRID.columns * MINI_LABEL_GRID.rows;
  const premiumPerPage = PREMIUM_LABEL_GRID.columns * PREMIUM_LABEL_GRID.rows;
  const sealPerPage = SEAL_GRID.columns * SEAL_GRID.rows;
  const addressPerPage = ADDRESS_LABEL_GRID.columns * ADDRESS_LABEL_GRID.rows;
  const bodyCarePerPage = BODY_CARE_STICKER_GRID.columns * BODY_CARE_STICKER_GRID.rows;
  const labelsPerPage =
    printMode === 'mini' ? miniPerPage
    : printMode === 'address' ? addressPerPage
    : printMode === 'premium' ? premiumPerPage
    : printMode === 'seal' ? sealPerPage
    : printMode === 'bodycare' ? bodyCarePerPage
    : bandsPerPage;

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
    if (printMode === 'seal') {
      return sealBatches.flatMap((b) =>
        Array.from({ length: b.qty }, (_, i) => ({ uid: `${b.id}-${i}`, ...b })),
      );
    }
    if (printMode === 'bodycare') {
      return bodyCareBatches.flatMap((b) =>
        Array.from({ length: b.qty }, (_, i) => ({ uid: `${b.id}-${i}`, ...b })),
      );
    }
    return activeBatches.flatMap((b) =>
      Array.from({ length: b.qty }, (_, i) => ({ uid: `${b.id}-${i}`, ...b })),
    );
  }, [activeBatches, sealBatches, bodyCareBatches, printMode, bandPages, bandsPerPage, addressCount]);

  // How full the last page is — surfaced as a capacity meter + ghost slots
  // so it's obvious how many more labels are needed to avoid wasting a
  // partially-filled sheet of (expensive) adhesive paper.
  const { pages, totalLabels, lastPageCount, freeOnLastPage } = computePagination(queue, labelsPerPage);

  // One-click "fill sheet" for the active product queue (mini/premium) —
  // pagination values are computed here (via computePagination above,
  // which depends on `queue`/`activeBatches`), so they're passed into the
  // hook's fillSheetEvenly rather than computed inside it.
  const fillSheetEvenly = () => fillActiveBatchesEvenly(freeOnLastPage, labelsPerPage, totalLabels);
  const fillBodyCareSheet = () => fillBodyCareSheetEvenly(freeOnLastPage, labelsPerPage, totalLabels);

  // Per-mode sheet layout — mini prints landscape, edge-to-edge, centered on the page.
  const sheetLayoutStyle =
    printMode === 'mini'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${MINI_LABEL_GRID.columns}, ${MINI_LABEL_SIZE_MM.width}mm)`,
          gridAutoRows: `${MINI_LABEL_SIZE_MM.height}mm`,
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
          gridTemplateColumns: `repeat(${ADDRESS_LABEL_GRID.columns}, ${ADDRESS_LABEL_SIZE_MM.width}mm)`,
          gap: '3mm',
          justifyContent: 'center',
          alignContent: 'start',
          padding: '8mm',
          width: '210mm',
          height: 'auto',
          minHeight: '297mm',
        }
      : printMode === 'premium'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${PREMIUM_LABEL_GRID.columns}, ${PREMIUM_LABEL_SIZE_MM.width}mm)`,
          gap: '3mm',
          justifyContent: 'center',
          alignContent: 'start',
          padding: '6mm',
          width: '210mm',
          height: 'auto',
          minHeight: '297mm',
        }
      : printMode === 'seal'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${SEAL_GRID.columns}, ${SEAL_SIZE_MM.width}mm)`,
          gap: '4mm',
          justifyContent: 'center',
          alignContent: 'start',
          padding: '8mm',
          width: '210mm',
          height: 'auto',
          minHeight: '297mm',
        }
      : printMode === 'bodycare'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${BODY_CARE_STICKER_GRID.columns}, ${BODY_CARE_STICKER_SIZE_MM.width}mm)`,
          gap: '4mm',
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

  // Turbopack's styled-jsx check requires `<style jsx>`'s child to be a
  // template literal, string, or plain identifier — not a function call
  // expression — so the computed CSS is assigned here first.
  const printStyles = getPrintStyles(printMode);

  return (
    <div className="labels-page">
      <style jsx global>{printStyles}</style>

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
          <button
            onClick={() => setPrintMode('premium')}
            style={{
              background: printMode === 'premium' ? COLORS.brand : 'transparent',
              color: printMode === 'premium' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Premium Label
          </button>
          <button
            onClick={() => setPrintMode('seal')}
            style={{
              background: printMode === 'seal' ? COLORS.brand : 'transparent',
              color: printMode === 'seal' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Occasion Seal
          </button>
          <button
            onClick={() => setPrintMode('bodycare')}
            style={{
              background: printMode === 'bodycare' ? COLORS.brand : 'transparent',
              color: printMode === 'bodycare' ? 'white' : COLORS.muted,
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Body Care
          </button>
        </div>

        {/* Premium: which variant the next Add targets — a product can have
            both a regular and a fragrance-free queue entry side by side,
            for customers sensitive to smell. Toggle before clicking a
            product chip or "to all". */}
        {printMode === 'premium' && (
          <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            <button
              onClick={() => setFragranceFreeMode(false)}
              style={{
                background: !fragranceFreeMode ? COLORS.brand : 'transparent',
                color: !fragranceFreeMode ? 'white' : COLORS.muted,
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
              Regular
            </button>
            <button
              onClick={() => setFragranceFreeMode(true)}
              style={{
                background: fragranceFreeMode ? COLORS.brand : 'transparent',
                color: fragranceFreeMode ? 'white' : COLORS.muted,
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
              No Fragrance
            </button>
          </div>
        )}

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

        {/* Seal: add a preset or custom message, + running capacity readout */}
        {printMode === 'seal' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={sealMessage}
              onChange={(e) => setSealMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomSeal()}
              placeholder="Custom message…"
              style={{ width: '160px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', fontFamily: FONTS.sans, boxSizing: 'border-box' }}
            />
            <button
              onClick={addCustomSeal}
              disabled={!sealMessage.trim()}
              style={{
                padding: '6px 14px',
                background: sealMessage.trim() ? COLORS.brand : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: sealMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONTS.sans,
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} /> Add
            </button>
            {sealBatches.length > 0 && (
              <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>
                {totalLabels} seal{totalLabels !== 1 ? 's' : ''} · {pages.length} page{pages.length !== 1 ? 's' : ''}
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

        {/* Body care: one-click fill (split evenly across the catalog) +
            running capacity readout. Per-product fine-tuning still happens
            via the palette chips below or the × on a printed sticker. */}
        {printMode === 'bodycare' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
            <button
              onClick={fillBodyCareSheet}
              disabled={!(BODY_CARE_PRODUCTS.length > 0 && (totalLabels === 0 || freeOnLastPage > 0))}
              title="Fill up the current sheet, split evenly across every body-care product"
              style={{
                padding: '6px 14px',
                background: BODY_CARE_PRODUCTS.length > 0 && (totalLabels === 0 || freeOnLastPage > 0) ? '#2563EB' : '#9CA3AF',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: BODY_CARE_PRODUCTS.length > 0 && (totalLabels === 0 || freeOnLastPage > 0) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: FONTS.sans,
                whiteSpace: 'nowrap',
              }}
            >
              <Layers size={14} /> Fill sheet
            </button>
            {bodyCareBatches.length > 0 && (
              <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: FONTS.sans }}>
                {totalLabels} sticker{totalLabels !== 1 ? 's' : ''} · {pages.length} page{pages.length !== 1 ? 's' : ''}
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

        {/* Mini + Premium: bulk-seed qty + running capacity readout (premium
            reuses the same product batches/palette as mini, just rendered
            bigger with full ingredients — see PremiumProductLabel) */}
        {(printMode === 'mini' || printMode === 'premium') && (
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
            {activeBatches.length > 0 && (
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
        {(printMode === 'mini' || printMode === 'premium') && (
          <div className="no-print" style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: FONTS.sans }}>
                Products — click to add one
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {products.map((p) => {
                // Sums across both variants (regular + fragrance-free) so
                // the chip's running total is accurate even when a product
                // has both queued — the batch list below shows the
                // per-variant breakdown.
                const queuedQty = activeBatches
                  .filter((b) => b.product_id === p.id)
                  .reduce((sum, b) => sum + b.qty, 0);
                const queued = queuedQty > 0;
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
                          {queuedQty}
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

        {/* Mini/Premium batch list — compact. Regular and fragrance-free
            copies of the same product are separate entries (different
            ids), so they naturally show as two rows here. */}
        {(printMode === 'mini' || printMode === 'premium') && activeBatches.length > 0 && (
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {activeBatches.map((batch) => (
              <div
                key={batch.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'white',
                  border: `1px solid ${batch.fragranceFree ? COLORS.brand : '#E5E7EB'}`,
                  borderRadius: '20px',
                  padding: '4px 10px 4px 6px',
                  fontSize: '12px',
                  fontFamily: FONTS.sans,
                }}
              >
                <span style={{ background: COLORS.brand, color: 'white', borderRadius: '12px', padding: '1px 7px', fontWeight: 800, fontSize: '11px' }}>{batch.qty}</span>
                <span style={{ fontWeight: 600, color: COLORS.text }}>
                  {batch.product_name}
                  {batch.fragranceFree && <span style={{ color: COLORS.brand, fontWeight: 800 }}> · No Fragrance</span>}
                </span>
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

        {/* Occasion preset palette — click a preset to add one seal to the
            sheet, tagging its icon + message. Custom messages are added via
            the text field in the control bar above instead of a chip here. */}
        {printMode === 'seal' && (
          <div className="no-print" style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: FONTS.sans }}>
                Occasions — click to add one
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {OCCASION_PRESETS.map((preset) => {
                const queued = sealBatches.find((b) => b.key === preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => addPresetSeal(preset)}
                    title="Add one"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '20px',
                      border: `1px solid ${queued ? preset.color : '#E5E7EB'}`,
                      background: queued ? `${preset.color}1A` : 'white',
                      padding: '5px 10px 5px 8px',
                      fontFamily: FONTS.sans,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.Icon({ size: 4.5, color: preset.color })}
                    {queued && (
                      <span style={{ background: preset.color, color: 'white', borderRadius: '10px', padding: '1px 6px', fontWeight: 800, fontSize: '11px' }}>
                        {queued.qty}
                      </span>
                    )}
                    <span style={{ fontWeight: queued ? 700 : 500, color: queued ? preset.color : COLORS.text }}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body-care product palette — click a product to add one sticker. */}
        {printMode === 'bodycare' && (
          <div className="no-print" style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: FONTS.sans }}>
                Body Care Products — click to add one
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {BODY_CARE_PRODUCTS.map((item) => {
                const queued = bodyCareBatches.find((b) => b.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addBodyCareItem(item)}
                    title="Add one"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '20px',
                      border: `1px solid ${queued ? item.color : '#E5E7EB'}`,
                      background: queued ? `${item.color}1A` : 'white',
                      padding: '5px 10px 5px 8px',
                      fontFamily: FONTS.sans,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    {queued && (
                      <span style={{ background: item.color, color: 'white', borderRadius: '10px', padding: '1px 6px', fontWeight: 800, fontSize: '11px' }}>
                        {queued.qty}
                      </span>
                    )}
                    <span style={{ fontWeight: queued ? 700 : 500, color: queued ? item.color : COLORS.text }}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body-care batch list — compact */}
        {printMode === 'bodycare' && bodyCareBatches.length > 0 && (
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {bodyCareBatches.map((batch) => (
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
                <span style={{ fontWeight: 600, color: COLORS.text }}>{batch.name}</span>
                <button onClick={() => removeBodyCareBatch(batch.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0', lineHeight: 1, display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button onClick={clearAllBodyCare} style={{ background: 'none', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
              Clear all
            </button>
          </div>
        )}

        {/* Seal batch list — compact */}
        {printMode === 'seal' && sealBatches.length > 0 && (
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {sealBatches.map((seal) => (
              <div
                key={seal.id}
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
                <span style={{ background: COLORS.brand, color: 'white', borderRadius: '12px', padding: '1px 7px', fontWeight: 800, fontSize: '11px' }}>{seal.qty}</span>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{seal.message}</span>
                <button onClick={() => removeSealBatch(seal.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0', lineHeight: 1, display: 'flex' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button onClick={clearAllSeals} style={{ background: 'none', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.sans }}>
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
                Page {pageIdx + 1} of {pages.length} — {page.length} {printMode === 'bands' ? 'bands' : printMode === 'seal' ? 'seals' : printMode === 'bodycare' ? 'stickers' : 'labels'}
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
                  : printMode === 'premium'
                  ? 'premium-page-sheet'
                  : printMode === 'seal'
                  ? 'seal-page-sheet'
                  : printMode === 'bodycare'
                  ? 'bodycare-page-sheet'
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
                ) : printMode === 'premium' ? (
                  <PremiumProductLabel
                    key={label.uid}
                    label={label}
                    sizeMm={PREMIUM_LABEL_SIZE_MM}
                    onRemove={() => removeOneFromBatch(label.id)}
                  />
                ) : printMode === 'seal' ? (
                  <OccasionSealLabel
                    key={label.uid}
                    seal={label}
                    onRemove={() => removeOneSealFromQueue(label.id)}
                  />
                ) : printMode === 'bodycare' ? (
                  <BodyCareStickerLabel
                    key={label.uid}
                    item={label}
                    onRemove={() => removeOneBodyCareItem(label.id)}
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
              {(printMode === 'mini' || printMode === 'address' || printMode === 'premium' || printMode === 'seal' || printMode === 'bodycare') &&
                pageIdx === pages.length - 1 &&
                Array.from({ length: freeOnLastPage }, (_, i) => (
                  <div
                    key={`ghost-${i}`}
                    className={`no-print ${
                      printMode === 'mini' ? 'mini-label' : printMode === 'address' ? 'address-sticker' : printMode === 'premium' ? 'premium-label' : printMode === 'bodycare' ? 'bodycare-sticker' : 'seal-label'
                    }`}
                    style={{
                      background: 'transparent',
                      backgroundImage: 'none',
                      border: '1px dashed #E5E7EB',
                      ...(printMode === 'premium' ? { width: `${PREMIUM_LABEL_SIZE_MM.width}mm`, height: `${PREMIUM_LABEL_SIZE_MM.height}mm` } : {}),
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
              : printMode === 'seal'
              ? 'Click an occasion above, or type a custom message, to add a seal.'
              : printMode === 'bodycare'
              ? 'Click a product above to add a sticker.'
              : 'Click a product above to add it to the sheet.'}
          </div>
        )}
      </div>
    </div>
  );
}
