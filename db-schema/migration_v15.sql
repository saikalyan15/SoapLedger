BEGIN;

-- Add internal notes field to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;

-- Set recommendation notes for each product
UPDATE products SET notes = 'Oils: Rosemary (default), Lemon, Lemon Grass, Peppermint, Eucalyptus, Lavender. Energising blend — citrus and mint amplify the ginger-rosemary character.' WHERE name = 'Ginger Rosemary Glycerin Soap';
UPDATE products SET notes = 'Oils: Chamomile (default), Lavender, Vanilla, Rose, Sandalwood. Warm, soothing profile complementing honey and oats.' WHERE name = 'Honey Oats Glycerin Soap';
UPDATE products SET notes = 'Oils: Marigold (default), Chamomile, Lavender, Rose, Frankincense. Gentle healing oils echoing the skin-soothing properties of Calendula.' WHERE name = 'Marigold Soap';
UPDATE products SET notes = 'Oils: Tea Tree (default), Eucalyptus, Lavender, Lemon, Peppermint, Oregano. Purifying, antibacterial blend reinforcing neem and tulsi.' WHERE name = 'Neem Tulsi Glycerin Soap';
UPDATE products SET notes = 'Oils: Orange (default), Lemon, Lemon Grass, Ylang Ylang, Lavender, Vanilla, Frankincense. Bright citrus extended with floral warmth.' WHERE name = 'Orange Glycerin Soap';
UPDATE products SET notes = 'Oils: Ylang Ylang (default), Rose, Jasmine, Lavender, Frankincense, Sandalwood. Rich antioxidant-floral profile matching the pomegranate character.' WHERE name = 'Pomegranate Glycerine Soap';
UPDATE products SET notes = 'Oils: Lavender (default), Rose, Chamomile, Vanilla, Orange. Universally appealing, gentle oils ideal for gift packaging.' WHERE name = 'Gift Soap Pouch – Set of 3';

UPDATE products SET notes = 'Oils: Orange (default), Lemon, Lemon Grass, Ylang Ylang, Lavender, Vanilla. Citrus-floral blend enhanced by the creamy goat milk base.' WHERE name = 'Orange Goatmilk Soap';
UPDATE products SET notes = 'Oils: Tea Tree (default), Eucalyptus, Lavender, Lemon, Peppermint, Oregano. Antibacterial oils reinforcing neem and tulsi — Lavender softens the edge.' WHERE name = 'Neem & Tulsi Goatmilk Soap';
UPDATE products SET notes = 'Oils: Rosemary (default), Lemon, Lemon Grass, Peppermint, Eucalyptus, Lavender. Invigorating herbal-citrus blend on a creamy goat milk base.' WHERE name = 'Ginger Rosemary Goat Milk Soap';
UPDATE products SET notes = 'Oils: Chamomile (default), Lavender, Vanilla, Rose, Sandalwood. Nourishing, soothing oils pairing with the rich honey-oats-goat milk formula.' WHERE name = 'Honey and Oats Goatmilk Soap';
UPDATE products SET notes = 'Oils: Ylang Ylang (default), Rose, Jasmine, Lavender, Frankincense. Luxurious floral-woody oils amplified by the creamy goat milk base.' WHERE name = 'Pomegranate Goatmilk Soap';
UPDATE products SET notes = 'Oils: Rose (default), Jasmine, Ylang Ylang, Lavender, Frankincense, Sandalwood, Chamomile, Vanilla. Broadest oil compatibility in the range — full floral-luxury profile.' WHERE name = 'Rice & Rose Goatmilk Soap';
UPDATE products SET notes = 'Oils: Frankincense (default), Lavender, Rose, Chamomile, Vanilla, Sandalwood. Warming, healing oils complementing turmeric brightening and honey nourishing properties.' WHERE name = 'Turmeric Honey Goatmilk Soap';

UPDATE products SET notes = 'Oils: Ylang Ylang (default), Rose, Sandalwood, Frankincense, Lavender. Ayurvedic luxury oils complementing saffron and turmeric.' WHERE name = 'Kesar-Haldi Soap';
UPDATE products SET notes = 'Oils: Lemon (default), Lemon Grass, Eucalyptus, Peppermint, Tea Tree, Rosemary, Citronella. Fresh, invigorating oils matching the exfoliating character — Citronella adds insect-repellent benefit.' WHERE name = 'Loofah Soaps';
UPDATE products SET notes = 'Oils: Lavender (default), Chamomile, Vanilla, Orange. Gentle, non-irritating oils safe for children.' WHERE name = 'Kids Collection (Set of 4)';

UPDATE products SET notes = 'Oils: Rose (default), Jasmine, Ylang Ylang, Lavender, Frankincense, Sandalwood, Vanilla. Romantic, luxurious floral-woody blend for the red wine base.' WHERE name = 'Red Rose Soap';
UPDATE products SET notes = 'Oils: Rose (default), Jasmine, Ylang Ylang, Sandalwood, Frankincense, Vanilla, Lavender. Intensely romantic — Jasmine and Ylang Ylang lead the passionate floral character.' WHERE name = 'Valentines Special Soap';

UPDATE products SET notes = 'Oils: Rose (default), Jasmine, Ylang Ylang, Sandalwood, Frankincense, Lavender, Vanilla. Rich floral-Ayurvedic blend for the saffron-rose-shea butter base.' WHERE name = 'Sheabutter – Kesar Gulab';
UPDATE products SET notes = 'Oils: Frankincense (default), Rose, Chamomile, Lavender, Vanilla, Sandalwood, Ylang Ylang. Frankincense anchors anti-aging profile — others add warmth and sweetness to this richest formula.' WHERE name = 'Honey Kesar Haldi Sheabutter Soap';

UPDATE products SET notes = 'Oils: Lavender (default), Tea Tree, Peppermint, Lemon, Eucalyptus, Citronella, Lemon Grass. Practical and versatile — Lavender is universal, Citronella ideal for tropical travel.' WHERE name = 'Travel Soaps';

-- Insert all recommended oil associations
-- Products with existing defaults → all new oils use is_default = false
-- Products without any default → first listed oil uses is_default = true
INSERT INTO product_essential_oils (product_id, essential_oil_id, is_default)
SELECT p.id, eo.id, v.is_default::boolean
FROM (VALUES
  -- Ginger Rosemary Glycerin Soap (Rosemary already default)
  ('Ginger Rosemary Glycerin Soap',   'Lemon',        false),
  ('Ginger Rosemary Glycerin Soap',   'Lemon Grass',  false),
  ('Ginger Rosemary Glycerin Soap',   'Peppermint',   false),
  ('Ginger Rosemary Glycerin Soap',   'Eucalyptus',   false),
  ('Ginger Rosemary Glycerin Soap',   'Lavender',     false),

  -- Honey Oats Glycerin Soap (Chamomile already default)
  ('Honey Oats Glycerin Soap',        'Lavender',     false),
  ('Honey Oats Glycerin Soap',        'Vanilla',      false),
  ('Honey Oats Glycerin Soap',        'Rose',         false),
  ('Honey Oats Glycerin Soap',        'Sandalwood',   false),

  -- Marigold Soap (Marigold already default)
  ('Marigold Soap',                   'Chamomile',    false),
  ('Marigold Soap',                   'Lavender',     false),
  ('Marigold Soap',                   'Rose',         false),
  ('Marigold Soap',                   'Frankincense', false),

  -- Neem Tulsi Glycerin Soap (Tea Tree already default)
  ('Neem Tulsi Glycerin Soap',        'Eucalyptus',   false),
  ('Neem Tulsi Glycerin Soap',        'Lavender',     false),
  ('Neem Tulsi Glycerin Soap',        'Lemon',        false),
  ('Neem Tulsi Glycerin Soap',        'Peppermint',   false),
  ('Neem Tulsi Glycerin Soap',        'Oregano',      false),

  -- Orange Glycerin Soap (Orange already default)
  ('Orange Glycerin Soap',            'Lemon',        false),
  ('Orange Glycerin Soap',            'Lemon Grass',  false),
  ('Orange Glycerin Soap',            'Ylang Ylang',  false),
  ('Orange Glycerin Soap',            'Lavender',     false),
  ('Orange Glycerin Soap',            'Vanilla',      false),
  ('Orange Glycerin Soap',            'Frankincense', false),

  -- Pomegranate Glycerine Soap (Ylang Ylang already default)
  ('Pomegranate Glycerine Soap',      'Rose',         false),
  ('Pomegranate Glycerine Soap',      'Jasmine',      false),
  ('Pomegranate Glycerine Soap',      'Lavender',     false),
  ('Pomegranate Glycerine Soap',      'Frankincense', false),
  ('Pomegranate Glycerine Soap',      'Sandalwood',   false),

  -- Gift Soap Pouch – Set of 3 (no default yet → Lavender is default)
  ('Gift Soap Pouch – Set of 3',      'Lavender',     true),
  ('Gift Soap Pouch – Set of 3',      'Rose',         false),
  ('Gift Soap Pouch – Set of 3',      'Chamomile',    false),
  ('Gift Soap Pouch – Set of 3',      'Vanilla',      false),
  ('Gift Soap Pouch – Set of 3',      'Orange',       false),

  -- Orange Goatmilk Soap (Orange already default)
  ('Orange Goatmilk Soap',           'Lemon',        false),
  ('Orange Goatmilk Soap',           'Lemon Grass',  false),
  ('Orange Goatmilk Soap',           'Ylang Ylang',  false),
  ('Orange Goatmilk Soap',           'Lavender',     false),
  ('Orange Goatmilk Soap',           'Vanilla',      false),

  -- Neem & Tulsi Goatmilk Soap (Tea Tree already default)
  ('Neem & Tulsi Goatmilk Soap',     'Eucalyptus',   false),
  ('Neem & Tulsi Goatmilk Soap',     'Lavender',     false),
  ('Neem & Tulsi Goatmilk Soap',     'Lemon',        false),
  ('Neem & Tulsi Goatmilk Soap',     'Peppermint',   false),
  ('Neem & Tulsi Goatmilk Soap',     'Oregano',      false),

  -- Ginger Rosemary Goat Milk Soap (Rosemary already default)
  ('Ginger Rosemary Goat Milk Soap', 'Lemon',        false),
  ('Ginger Rosemary Goat Milk Soap', 'Lemon Grass',  false),
  ('Ginger Rosemary Goat Milk Soap', 'Peppermint',   false),
  ('Ginger Rosemary Goat Milk Soap', 'Eucalyptus',   false),
  ('Ginger Rosemary Goat Milk Soap', 'Lavender',     false),

  -- Honey and Oats Goatmilk Soap (Chamomile already default)
  ('Honey and Oats Goatmilk Soap',   'Lavender',     false),
  ('Honey and Oats Goatmilk Soap',   'Vanilla',      false),
  ('Honey and Oats Goatmilk Soap',   'Rose',         false),
  ('Honey and Oats Goatmilk Soap',   'Sandalwood',   false),

  -- Pomegranate Goatmilk Soap (Ylang Ylang already default)
  ('Pomegranate Goatmilk Soap',      'Rose',         false),
  ('Pomegranate Goatmilk Soap',      'Jasmine',      false),
  ('Pomegranate Goatmilk Soap',      'Lavender',     false),
  ('Pomegranate Goatmilk Soap',      'Frankincense', false),

  -- Rice & Rose Goatmilk Soap (no default yet → Rose is default)
  ('Rice & Rose Goatmilk Soap',      'Rose',         true),
  ('Rice & Rose Goatmilk Soap',      'Jasmine',      false),
  ('Rice & Rose Goatmilk Soap',      'Ylang Ylang',  false),
  ('Rice & Rose Goatmilk Soap',      'Lavender',     false),
  ('Rice & Rose Goatmilk Soap',      'Frankincense', false),
  ('Rice & Rose Goatmilk Soap',      'Sandalwood',   false),
  ('Rice & Rose Goatmilk Soap',      'Chamomile',    false),
  ('Rice & Rose Goatmilk Soap',      'Vanilla',      false),

  -- Turmeric Honey Goatmilk Soap (no default yet → Frankincense is default)
  ('Turmeric Honey Goatmilk Soap',   'Frankincense', true),
  ('Turmeric Honey Goatmilk Soap',   'Lavender',     false),
  ('Turmeric Honey Goatmilk Soap',   'Rose',         false),
  ('Turmeric Honey Goatmilk Soap',   'Chamomile',    false),
  ('Turmeric Honey Goatmilk Soap',   'Vanilla',      false),
  ('Turmeric Honey Goatmilk Soap',   'Sandalwood',   false),

  -- Kesar-Haldi Soap (Ylang Ylang already default)
  ('Kesar-Haldi Soap',               'Rose',         false),
  ('Kesar-Haldi Soap',               'Sandalwood',   false),
  ('Kesar-Haldi Soap',               'Frankincense', false),
  ('Kesar-Haldi Soap',               'Lavender',     false),

  -- Loofah Soaps (no default yet → Lemon is default)
  ('Loofah Soaps',                   'Lemon',        true),
  ('Loofah Soaps',                   'Lemon Grass',  false),
  ('Loofah Soaps',                   'Eucalyptus',   false),
  ('Loofah Soaps',                   'Peppermint',   false),
  ('Loofah Soaps',                   'Tea Tree',     false),
  ('Loofah Soaps',                   'Rosemary',     false),
  ('Loofah Soaps',                   'Citronella',   false),

  -- Kids Collection (Set of 4) (no default yet → Lavender is default)
  ('Kids Collection (Set of 4)',     'Lavender',     true),
  ('Kids Collection (Set of 4)',     'Chamomile',    false),
  ('Kids Collection (Set of 4)',     'Vanilla',      false),
  ('Kids Collection (Set of 4)',     'Orange',       false),

  -- Red Rose Soap (Rose already default)
  ('Red Rose Soap',                  'Jasmine',      false),
  ('Red Rose Soap',                  'Ylang Ylang',  false),
  ('Red Rose Soap',                  'Lavender',     false),
  ('Red Rose Soap',                  'Frankincense', false),
  ('Red Rose Soap',                  'Sandalwood',   false),
  ('Red Rose Soap',                  'Vanilla',      false),

  -- Valentines Special Soap (no default yet → Rose is default)
  ('Valentines Special Soap',        'Rose',         true),
  ('Valentines Special Soap',        'Jasmine',      false),
  ('Valentines Special Soap',        'Ylang Ylang',  false),
  ('Valentines Special Soap',        'Sandalwood',   false),
  ('Valentines Special Soap',        'Frankincense', false),
  ('Valentines Special Soap',        'Vanilla',      false),
  ('Valentines Special Soap',        'Lavender',     false),

  -- Sheabutter – Kesar Gulab (Rose already default)
  ('Sheabutter – Kesar Gulab',       'Jasmine',      false),
  ('Sheabutter – Kesar Gulab',       'Ylang Ylang',  false),
  ('Sheabutter – Kesar Gulab',       'Sandalwood',   false),
  ('Sheabutter – Kesar Gulab',       'Frankincense', false),
  ('Sheabutter – Kesar Gulab',       'Lavender',     false),
  ('Sheabutter – Kesar Gulab',       'Vanilla',      false),

  -- Honey Kesar Haldi Sheabutter Soap (no default yet → Frankincense is default)
  ('Honey Kesar Haldi Sheabutter Soap', 'Frankincense', true),
  ('Honey Kesar Haldi Sheabutter Soap', 'Rose',         false),
  ('Honey Kesar Haldi Sheabutter Soap', 'Chamomile',    false),
  ('Honey Kesar Haldi Sheabutter Soap', 'Lavender',     false),
  ('Honey Kesar Haldi Sheabutter Soap', 'Vanilla',      false),
  ('Honey Kesar Haldi Sheabutter Soap', 'Sandalwood',   false),
  ('Honey Kesar Haldi Sheabutter Soap', 'Ylang Ylang',  false),

  -- Travel Soaps (no default yet → Lavender is default)
  ('Travel Soaps',                   'Lavender',     true),
  ('Travel Soaps',                   'Tea Tree',     false),
  ('Travel Soaps',                   'Peppermint',   false),
  ('Travel Soaps',                   'Lemon',        false),
  ('Travel Soaps',                   'Eucalyptus',   false),
  ('Travel Soaps',                   'Citronella',   false),
  ('Travel Soaps',                   'Lemon Grass',  false)

) AS v(product_name, oil_name, is_default)
JOIN products p ON p.name = v.product_name
JOIN essential_oils eo ON eo.name = v.oil_name
ON CONFLICT (product_id, essential_oil_id) DO NOTHING;

COMMIT;
