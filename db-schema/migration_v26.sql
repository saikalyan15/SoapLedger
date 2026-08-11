BEGIN;

-- Purpose-written copy for the constrained 38.1 x 14 mm mini-soap sticker.
-- This is intentionally separate from website copy and the complete ingredient
-- declaration: neither should be silently clipped to make a small label fit.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS mini_label_description TEXT;

COMMIT;
