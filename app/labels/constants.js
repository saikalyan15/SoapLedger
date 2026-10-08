export const COLORS = {
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
export const BAND_SIZES = {
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

export const FONTS = {
  sans: '"Plus Jakarta Sans", "Inter", Arial, sans-serif',
};

// The description field is already capped at 44 chars (see
// MAX_MINI_LABEL_DESCRIPTION_LENGTH in lib/actions/products.js), so it gets
// one fixed size, sized to the sticker's width (the binding constraint on
// how much of the 44 chars fits per line) rather than its 18mm height. Kept
// under the title so the title reads as the more prominent line — verified
// via rendered test stickers that the worst-case combo (the actual longest
// current product name, 35 chars, wrapping to 3 title lines, paired with a
// max-length 44-char description) still fits without clipping at 9pt title
// / 7pt description; the previous 10pt/8pt (sized for a 20mm-tall sticker)
// clips that same worst case at 18mm.
export const MINI_INGREDIENT_FONT_SIZE = '7pt';

// One fixed size for every title, same reasoning as the description above —
// a sheet with a mix of products reads better with a consistent title size
// than one that visibly shrinks per product. product_name has no length
// cap, so long names wrap to further lines instead.
export const MINI_TITLE_FONT_SIZE = '9pt';

// 40mm x 18mm — the measured size of the pre-cut adhesive sticker sheet in
// hand (4x1.8cm), sized down from the initial 4x2cm measurement. 7x11 grid
// on a 297x210mm landscape A4 sheet (77/sheet, auto-centered — neither
// dimension tiles the sheet edge-to-edge at this size: 7 x 40mm = 280mm,
// 11 x 18mm = 198mm).
export const MINI_LABEL_SIZE_MM = { width: 40, height: 18 };
export const MINI_LABEL_GRID = { columns: 7, rows: 11 };

// Premium soap label — a standalone, occasional premium tier (gift sets,
// festive runs), NOT a replacement for the wrapper band + mini sticker
// combo used on regular stock, and not fitted into the band's cutout.
// One size fits both bar shapes rather than a per-bar-size toggle — sized
// to sit inside the smaller dimension of each bar face already measured
// for the band above (100g bar's front face ~54x35mm, 50g bar's square
// top face ~40x40mm): 36x35mm clears the 50g bar's 40mm width with 2mm
// either side, and runs flush with the 100g bar's 35mm height (no
// margin left on that edge — raised from 30mm to give long product
// names/ingredient lists and the "No Fragrance" badge room without
// clipping). Verify against the actual bars with a plain-paper test
// print before committing sticker stock.
export const PREMIUM_LABEL_SIZE_MM = { width: 36, height: 35 };
// 7 rows (not 8) — at 35mm tall, an 8th row would overflow the 297mm A4
// page height once the sheet's padding and inter-row gaps are added.
export const PREMIUM_LABEL_GRID = { columns: 5, rows: 7 };

// Occasion "seal" sticker — round, sized to hold shut a folded sheet of
// brown paper (a "topper wrap" laid over a bundle of already cling- and
// brown-paper-wrapped bars before the box lid closes), like a wax seal on
// a letter. It seals a paper fold, not a box exterior — the box's to/from
// address already lives on its own sticker (see the `address` mode) — so
// this doesn't need to vary by box size; one size covers every box.
export const SEAL_SIZE_MM = { width: 48, height: 48 };
export const SEAL_GRID = { columns: 3, rows: 5 };

// Address sticker — 62x36mm, 3x7 grid, 21 per sheet (8mm padding + 3mm
// gaps: 7*36 + 6*3 = 270mm fits inside the 281mm usable height of a
// 297mm-tall A4 page).
export const ADDRESS_LABEL_SIZE_MM = { width: 62, height: 36 };
export const ADDRESS_LABEL_GRID = { columns: 3, rows: 7 };

// Body-care sticker (body butter, lip balm, ...) — round, stuck on the
// flat black lid of a jar rather than wrapped around a side, so round
// like the occasion seal, just much smaller: the lid is ~2in/50mm across,
// the sticker sits centered on it at ~1in/25mm. Exact mm pinned here after
// a plain-paper test print against the real jars (see the labels plan).
// 6x9 grid on a 210x297mm portrait A4 sheet (54/sheet; 8mm padding + 4mm
// gaps: 6*25 + 5*4 = 170mm fits the 194mm usable width, 9*25 + 8*4 = 257mm
// fits the 281mm usable height).
export const BODY_CARE_STICKER_SIZE_MM = { width: 25, height: 25 };
export const BODY_CARE_STICKER_GRID = { columns: 6, rows: 9 };

// These product lines don't get individual labels printed (gift/seasonal
// bundles, kids sets, discovery boxes, and travel minis are packaged and
// labeled differently) — keep them out of the label palette entirely.
export const EXCLUDED_FROM_LABELS = [/valentine/i, /\bkids\b/i, /discovery box/i, /\btravel\b/i, /gift.*pouch/i];
