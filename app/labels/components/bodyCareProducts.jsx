// Body-care sticker catalog (body butter, lip balm, ...) — a plain config
// array, not a DB table, like OCCASION_PRESETS: this line is low-volume and
// sticker-only for now, not tracked through the product/batch system, so
// adding the next product is one more entry here, nothing else. Each gets
// its own accent `color` — that's the only thing that tells two stickers
// apart at a glance, since the logo and layout are identical across the
// whole line.
export const BODY_CARE_PRODUCTS = [
  { id: 'avocado-body-butter', name: 'Avocado Body Butter', color: '#7C8C3E' },
  { id: 'kokum-lip-balm', name: 'Kokum Lip Balm', color: '#B23A5E' },
];
