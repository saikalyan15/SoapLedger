import {
  COLORS,
  FONTS,
  MINI_LABEL_SIZE_MM,
  MINI_LABEL_GRID,
  PREMIUM_LABEL_SIZE_MM,
  PREMIUM_LABEL_GRID,
  SEAL_SIZE_MM,
  SEAL_GRID,
  ADDRESS_LABEL_SIZE_MM,
  ADDRESS_LABEL_GRID,
} from './constants';

// The one style block covering all 5 label types, for both screen editing
// and print. `jsx global` styles aren't scoped/hashed to a component, so
// this plain template string behaves identically to having the template
// literal inline — no need for styled-jsx's external-CSS coordination,
// which exists to keep two files' generated class names in sync for
// *scoped* styles, not global ones. Callers must assign the result to a
// local variable before rendering it — `<style jsx>`'s child must be a
// template literal, string, or identifier (Turbopack's styled-jsx check
// rejects a function-call expression directly inside it).
export function getPrintStyles(printMode) {
  return `
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
          width: ${MINI_LABEL_SIZE_MM.width}mm;
          height: ${MINI_LABEL_SIZE_MM.height}mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background: transparent;
        }

        .address-sticker {
          width: ${ADDRESS_LABEL_SIZE_MM.width}mm;
          height: ${ADDRESS_LABEL_SIZE_MM.height}mm;
          border: 1px dashed #ccc;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background: white;
        }

        /* Premium label: double-rule frame — outer dashed cut-guide (this
           border), inner solid brand-green hairline (.premium-label-frame)
           — the main "premium" signal, at effectively zero extra ink.
           Width/height are set inline from PREMIUM_LABEL_SIZE_MM, not here. */
        .premium-label {
          border: 1px dashed #ccc;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background: white;
          padding: 1.3mm;
        }
        .premium-label-frame {
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          border: 0.3mm solid ${COLORS.brand};
          border-radius: 1.5mm;
        }

        /* Occasion seal: round, like a wax seal — same double-rule idea,
           just circular. One fixed size regardless of box size. */
        .seal-label {
          width: ${SEAL_SIZE_MM.width}mm;
          height: ${SEAL_SIZE_MM.height}mm;
          border: 1px dashed #ccc;
          border-radius: 50%;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          background: white;
          padding: 1.8mm;
        }
        .seal-label-frame {
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          border: 0.3mm solid ${COLORS.brand};
          border-radius: 50%;
        }

        /* Remove-on-hover: the × only shows while hovering a printed label,
           so the sheet preview stays clean until you're pointing at the
           exact one you want to pull off. */
        .remove-label-btn {
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .mini-label:hover .remove-label-btn,
        .address-sticker:hover .remove-label-btn,
        .premium-label:hover .remove-label-btn,
        .seal-label:hover .remove-label-btn {
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
            grid-template-columns: repeat(${MINI_LABEL_GRID.columns}, ${MINI_LABEL_SIZE_MM.width}mm) !important;
            grid-auto-rows: ${MINI_LABEL_SIZE_MM.height}mm !important;
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
            grid-template-columns: repeat(${ADDRESS_LABEL_GRID.columns}, ${ADDRESS_LABEL_SIZE_MM.width}mm) !important;
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

          .premium-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(${PREMIUM_LABEL_GRID.columns}, ${PREMIUM_LABEL_SIZE_MM.width}mm) !important;
            gap: 3mm !important;
            justify-content: center !important;
            align-content: start !important;
            padding: 6mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            break-after: page;
            width: 210mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
          }
          .premium-page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .seal-page-sheet {
            display: grid !important;
            grid-template-columns: repeat(${SEAL_GRID.columns}, ${SEAL_SIZE_MM.width}mm) !important;
            gap: 4mm !important;
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
          .seal-page-sheet:last-child {
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
            width: ${MINI_LABEL_SIZE_MM.width}mm !important;
            height: ${MINI_LABEL_SIZE_MM.height}mm !important;
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
            width: ${ADDRESS_LABEL_SIZE_MM.width}mm !important;
            height: ${ADDRESS_LABEL_SIZE_MM.height}mm !important;
            border: 0.1mm dashed #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
          }

          .premium-label {
            width: ${PREMIUM_LABEL_SIZE_MM.width}mm !important;
            height: ${PREMIUM_LABEL_SIZE_MM.height}mm !important;
            border: 0.1mm dashed #000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: white !important;
          }

          .seal-label {
            width: ${SEAL_SIZE_MM.width}mm !important;
            height: ${SEAL_SIZE_MM.height}mm !important;
            border: 0.1mm dashed #000 !important;
            border-radius: 50% !important;
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
      `;
}
