-- ============================================================
-- MIGRATION v4.0 — API Extensions & Schema Updates
-- ============================================================

BEGIN;

-- 1. Extend products table for website API support
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS price_range TEXT,
  ADD COLUMN IF NOT EXISTS ingredients TEXT;

-- 2. Populate slugs for existing products based on name
UPDATE products 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 3. Relax status check on orders to include 'Order Placed' and others
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'Order Placed', 'Received', 'Awaiting Payment', 'Payment Confirmed', 
    'In Manufacturing', 'Ready to Dispatch', 'Dispatched', 'Delivered'
  ));

COMMIT;
