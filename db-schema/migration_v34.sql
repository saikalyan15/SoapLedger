BEGIN;

-- MIGRATION v34 — Product type taxonomy + per-event stock-on-hand.
--
-- products.product_type: `category` is free text that mostly just repeats
-- base_type (the ingredient family, e.g. Glycerine) and is already consumed
-- by the live storefront API, so it isn't safe to repurpose as a real type
-- taxonomy. This is a small, deliberately extensible enum — easy to widen
-- later via an enum + CHECK change if the catalog grows more variety. The
-- backfill below is best-effort (name/is_gift matching), not exhaustive —
-- spot-check the Products page afterward.
--
-- event_inventory.in_stock_quantity: a fresh manual count entered per event
-- (no persistent running inventory ledger). "To make" is never stored — it's
-- always computed as max(0, planned_quantity - in_stock_quantity).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Soap';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_product_type_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_product_type_check
      CHECK (product_type IN ('Soap', 'Balm', 'Gift Set', 'Other'));
  END IF;
END $$;

UPDATE products SET product_type = 'Gift Set' WHERE is_gift = true;
UPDATE products SET product_type = 'Balm' WHERE product_type = 'Soap' AND name ILIKE '%balm%';
UPDATE products SET product_type = 'Other' WHERE product_type = 'Soap' AND name ILIKE '%body butter%';

ALTER TABLE event_inventory
  ADD COLUMN IF NOT EXISTS in_stock_quantity INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_inventory_in_stock_quantity_check'
  ) THEN
    ALTER TABLE event_inventory
      ADD CONSTRAINT event_inventory_in_stock_quantity_check
      CHECK (in_stock_quantity >= 0);
  END IF;
END $$;

COMMIT;
