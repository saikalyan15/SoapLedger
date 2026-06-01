BEGIN;

-- MIGRATION v17.0 — Add texture field to products table
-- Describes the physical feel of a soap bar for the storefront.
-- Allowed values: smooth | mildly-textured | textured | loofah
ALTER TABLE products
  ADD COLUMN texture TEXT CHECK (texture IN ('smooth', 'mildly-textured', 'textured', 'loofah'));

COMMIT;
