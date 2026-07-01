BEGIN;

-- MIGRATION v21 — Add product-level wholesale eligibility
-- Controls which catalogue products are eligible for wholesale reports and quotations.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_wholesale_eligible BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE products
SET is_wholesale_eligible = FALSE
WHERE
  name IN (
    'Gift Soap Pouch – Set of 3',
    'Kids Collection (Set of 4)',
    'Soap Squares Discovery Box - Light',
    'Soap Squares Discovery Box - Creamy',
    'Soap Squares Discovery Box - Rich',
    'Valentines Special Soap'
  )
  OR base_type IN ('Travel', 'Loofah');

COMMIT;
