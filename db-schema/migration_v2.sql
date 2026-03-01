-- ============================================================
-- SOAPLEDGER — Migration v2.0
-- Rebuild Expenses with Categories
-- ============================================================

BEGIN;

-- 1. Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  color       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('recurring', 'one_time')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Seed default categories
INSERT INTO expense_categories (name, color, type) VALUES
  ('Raw Material', '#1B4332', 'recurring'),
  ('Packaging',    '#D4A017', 'recurring'),
  ('Shipping',     '#0F766E', 'recurring'),
  ('Equipment',    '#6B21A8', 'one_time'),
  ('Training',     '#DC2626', 'one_time'),
  ('Marketing',    '#0369A1', 'one_time'),
  ('Gifting',      '#BE185D', 'one_time'),
  ('Other',        '#6B7280', 'one_time')
ON CONFLICT (name) DO NOTHING;

-- 3. Update expenses table
-- Add category_id column (initially nullable)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES expense_categories(id);

-- 4. Link existing expenses to 'Other' category by default
UPDATE expenses 
SET category_id = (SELECT id FROM expense_categories WHERE name = 'Other')
WHERE category_id IS NULL;

-- 5. Make category_id NOT NULL
ALTER TABLE expenses ALTER COLUMN category_id SET NOT NULL;

-- 6. Cleanup Raw Materials (optional - since we merged them into expenses)
-- If you want to migrate existing raw_materials to expenses:
INSERT INTO expenses (description, amount, expense_date, category_id, notes)
SELECT 
  name || ' (' || quantity || ' ' || unit || ')',
  total_cost,
  procured_on,
  (SELECT id FROM expense_categories WHERE name = 'Raw Material'),
  notes
FROM raw_materials;

-- 7. Drop raw_materials table
DROP TABLE IF EXISTS raw_materials;

COMMIT;
