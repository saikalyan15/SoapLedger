-- ============================================================
-- MIGRATION v6.0 — Default Value Fixes
-- ============================================================

BEGIN;

-- Set default packaging_cost to 0 instead of 100
ALTER TABLE orders ALTER COLUMN packaging_cost SET DEFAULT 0;

-- Optional: Update existing orders that were created with the 100 default 
-- but might have been meant to be 0 (only if they are in 'Order Placed' status)
UPDATE orders SET packaging_cost = 0 WHERE packaging_cost = 100 AND status = 'Order Placed';

COMMIT;
