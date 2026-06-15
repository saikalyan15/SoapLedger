BEGIN;

-- MIGRATION v19 — Add is_gift flag to products
-- Marks a product as giftable so the website's "Shop Gifts" filter can be
-- driven from data instead of a hardcoded slug list. Cross-cutting with
-- category: a bar can belong to a display category and still be a gift.
ALTER TABLE products
  ADD COLUMN is_gift BOOLEAN NOT NULL DEFAULT false;

COMMIT;
