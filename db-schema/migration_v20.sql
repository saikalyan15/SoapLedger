BEGIN;

-- MIGRATION v20 — Add Healing Soil Discovery Box products
-- These rows are product source-of-truth entries for the storefront API.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS display_order INT;

WITH discovery_boxes (
  name,
  slug,
  base_type,
  weight_grams,
  unit_price,
  price_range,
  is_active,
  in_stock,
  is_featured,
  is_gift,
  is_seasonal,
  category,
  texture,
  image_url,
  short_description,
  ingredients,
  notes,
  display_order,
  featured_order
) AS (
  VALUES
    (
      'Soap Squares Discovery Box - Creamy',
      'soap-squares-creamy-box',
      'Goat Milk',
      200,
      799.00,
      '₹799',
      true,
      true,
      true,
      true,
      false,
      'gift',
      null,
      '/products/soap-squares-creamy-box.png',
      'Four mini handmade goat milk soaps in one kraft box. A simple way to try different creamy-feeling Healing Soil bars, keep a few guest soaps, or gift a small-batch set.',
      'Assorted Goat Milk Soap Squares, Natural oils, Botanicals, Essential oils',
      'Contents: 4 x 50g Goat Milk Soap Squares. Fixed box, no choose-your-own selection. Exact variants rotate by current batch.',
      -30,
      -30
    ),
    (
      'Soap Squares Discovery Box - Light',
      'soap-squares-light-box',
      'Glycerine',
      200,
      599.00,
      '₹599',
      true,
      true,
      true,
      true,
      false,
      'gift',
      null,
      '/products/soap-squares-light-box.png',
      'Four mini handmade glycerin soaps in one kraft box. A lighter way to try different Healing Soil bars, keep a few guest soaps, or gift a small-batch set.',
      'Assorted Glycerin Soap Squares, Natural oils, Botanicals, Essential oils',
      'Contents: 4 x 50g Glycerin Soap Squares. Fixed box, no choose-your-own selection. Exact variants rotate by current batch.',
      -20,
      -20
    ),
    (
      'Soap Squares Discovery Box - Rich',
      'soap-squares-rich-box',
      'Shea Butter',
      200,
      899.00,
      '₹899',
      true,
      true,
      true,
      true,
      false,
      'gift',
      null,
      '/products/soap-squares-rich-box.png',
      'Four mini handmade soaps in one kraft box, with a richer-feeling mix of shea butter and goat milk soaps. Made for discovery, guest bathrooms, and gifting.',
      'Assorted Shea Butter Soap Squares, Assorted Goat Milk Soap Squares, Natural oils, Botanicals',
      'Contents: 2 x 50g Shea Butter + 2 x 50g Goat Milk. Fixed box, no choose-your-own selection. Exact variants rotate by current batch.',
      -10,
      -10
    )
)
INSERT INTO products (
  name,
  slug,
  base_type,
  weight_grams,
  unit_price,
  price_range,
  is_active,
  in_stock,
  is_featured,
  is_gift,
  is_seasonal,
  category,
  texture,
  image_url,
  short_description,
  ingredients,
  notes,
  display_order,
  featured_order
)
SELECT
  name,
  slug,
  base_type,
  weight_grams,
  unit_price,
  price_range,
  is_active,
  in_stock,
  is_featured,
  is_gift,
  is_seasonal,
  category,
  texture,
  image_url,
  short_description,
  ingredients,
  notes,
  display_order,
  featured_order
FROM discovery_boxes
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  base_type = EXCLUDED.base_type,
  weight_grams = EXCLUDED.weight_grams,
  unit_price = EXCLUDED.unit_price,
  price_range = EXCLUDED.price_range,
  is_active = EXCLUDED.is_active,
  in_stock = EXCLUDED.in_stock,
  is_featured = EXCLUDED.is_featured,
  is_gift = EXCLUDED.is_gift,
  is_seasonal = EXCLUDED.is_seasonal,
  category = EXCLUDED.category,
  texture = EXCLUDED.texture,
  image_url = EXCLUDED.image_url,
  short_description = EXCLUDED.short_description,
  ingredients = EXCLUDED.ingredients,
  notes = EXCLUDED.notes,
  display_order = EXCLUDED.display_order,
  featured_order = EXCLUDED.featured_order;

COMMIT;
