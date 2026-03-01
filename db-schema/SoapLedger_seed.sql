-- ============================================================
-- SOAPLEDGER — Complete Seed Data
-- Run this in Neon SQL Editor after the schema is in place
-- Products are already seeded from the schema file
-- This seeds: additional products, customers, orders,
--             order_items, and expenses
-- ============================================================

BEGIN;

-- ============================================================
-- ADDITIONAL PRODUCTS
-- These appeared in orders but were not in the original schema seed
-- ============================================================
INSERT INTO products (name, base_type, weight_grams, unit_price, is_active, is_seasonal)
VALUES
  ('Honey Oats Goatmilk Soap',        'Goat Milk',   100, 350.00, TRUE, FALSE),
  ('Ginger Rosemary Goatmilk Soap',   'Goat Milk',   100, 350.00, TRUE, FALSE),
  ('Honey Kesar Haldi Sheabutter Soap','Shea Butter', 100, 400.00, TRUE, FALSE)
ON CONFLICT DO NOTHING;


-- ============================================================
-- CUSTOMERS
-- Phone is the unique key. Sonia has two orders with same phone
-- so she is inserted once. Sonia orders 3 & 4 reuse her record.
-- ============================================================
INSERT INTO customers (name, phone, address) VALUES
  ('Lisha',         '9740755077',      'B006 Raghu Regency, Gokul Extension, Mathikere, Bangalore 560054'),
  ('Sonia Devraj',  '7036210006',      'Villa 46, Confident Bella Frix, Sarjapura-Attibele Rd, Bangalore Anekal'),
  ('Shubhada Rajiv','7019031210',      '206, Sobha PrimeRose, Bellandur, Bangalore 560103'),
  ('Riya Basak',    '8564987443',      '88 Temple Road, Ganesh Vaibhav, First Floor, NGEF G Layout, Sadanandnagar 560038'),
  ('Akshatha',      '9986688384',      'Akshatha A S, Dhuthi Farm, Hoovinahalli K, Byadarahalli Post, Shantigrama Hobli, Hassan District 573225'),
  ('Latha',         '9900655322',      'Door 2/358, Kalli Kudi - Kanapalti, Kurayur, Kalli Kudi Taluk, Madurai 625701'),
  ('Shiva Prakash', '9844028551',      'Fire Cools, 7 KHB Colony, MIG 1st Stage, 1st Main, Basaveshwaranagar, Bangalore 560079'),
  ('Mahendra',      '9341220847',      'No 25/1, Madhuban, 1st Main 2nd Cross, Baljinagar, Suddaguntepalya, Bangalore 560029'),
  ('Deepthi Anoop', '7411621624',      'Villa 30, Azen Breathe, Bhd Indus Int School, Thyavaraknahalli, Sarjapura-Attibele'),
  ('Samyuktha',     '8105571140',      'Villa 68, Confident Bellatrix, Sarjapura-Attibele, Bangalore 562125'),
  ('Lahri',         '8130382461',      'Villa 100, Confident Bellatrix, Sarjapura-Attibele Rd, Bangalore 562125'),
  ('Snehal Rane',   '9594967734',      'Villa 4, Lakeview, Lakshmisagar 3rd, Chandapura Road, Aster MEGfit Int School 562107'),
  ('Asha G',        '+16082590566',    'Villa 117, Confident Bellatrix, Sarjapura-Attibele Rd, Bangalore'),
  ('Krithish Jain', '9884645000',      'C-403 Globus Nakshatra Apartments, Punnairajapuram, AKS Nagar, Coimbatore 641001'),
  ('Shweta Kikla',  '9663199866',      'Flat No 1101, 11th Floor, Confident Regal Althina, Sarjapura, Anekal Taluk, Bangalore 562125')
ON CONFLICT (phone) DO NOTHING;


-- ============================================================
-- ORDERS + ORDER ITEMS
-- Using CTEs to resolve customer IDs and product IDs cleanly
-- material_cost and packaging_cost set to 0 — update later in app
-- ============================================================

-- ORDER 1 — Lisha — 23 Dec 2025
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2025-12-23', 1500.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9740755077'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Honey Oats Glycerin Soap',      2, 250.00),
  ('Ginger Rosemary Glycerin Soap', 1, 250.00),
  ('Red Rose Soap',                 2, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 2 — Sonia Devraj — 16 Dec 2025
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status, notes)
  SELECT id, '2025-12-16', 550.00, 70.00, 0.00, 0.00, 'Delivered', 'Shipping was ₹70 in early orders'
  FROM customers WHERE phone = '7036210006'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Red Rose Soap',            1, 250.00),
  ('Honey Oats Glycerin Soap', 1, 250.00),
  ('Travel Soaps',             1,  50.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 3 — Sonia Devraj — 6 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-06', 500.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '7036210006'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Red Rose Soap',           2, 250.00),
  ('Neem & Tulsi Goatmilk Soap', 2, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 4 — Sonia Devraj — 28 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-28', 1100.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '7036210006'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Neem & Tulsi Goatmilk Soap',    1, 250.00),
  ('Honey Oats Glycerin Soap',      1, 250.00),
  ('Kesar-Haldi Soap',              1, 350.00),
  ('Ginger Rosemary Glycerin Soap', 1, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 5 — Shubhada Rajiv — 8 Jan 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status, notes)
  SELECT id, '2026-01-08', 700.00, 70.00, 0.00, 0.00, 'Delivered', 'Shipping was ₹70 in early orders'
  FROM customers WHERE phone = '7019031210'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Neem & Tulsi Goatmilk Soap', 2, 350.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 6 — Riya Basak — 30 Jan 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-01-30', 450.00, 100.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '8564987443'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Honey Oats Glycerin Soap', 1, 250.00),
  ('Travel Soaps',             2,  50.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 7 — Akshatha — 19 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-19', 600.00, 100.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9986688384'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Neem Tulsi Glycerin Soap', 1, 250.00),
  ('Kesar-Haldi Soap',         1, 350.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 8 — Latha — 1 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-01', 500.00, 100.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9900655322'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Honey Oats Glycerin Soap', 1, 250.00),
  ('Red Rose Soap',            1, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 9 — Shiva Prakash — 9 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-09', 1000.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9844028551'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Red Rose Soap', 4, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 10 — Mahendra — 16 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-16', 1300.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9341220847'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Kesar-Haldi Soap',              1, 350.00),
  ('Ginger Rosemary Glycerin Soap', 1, 250.00),
  ('Travel Soaps',                  1,  50.00),
  ('Neem Tulsi Glycerin Soap',      1, 250.00),
  ('Sheabutter – Kesar Gulab',      1, 400.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 11 — Deepthi Anoop — 24 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-24', 500.00, 100.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '7411621624'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Honey Oats Glycerin Soap',      1, 250.00),
  ('Ginger Rosemary Glycerin Soap', 1, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 12 — Samyuktha — 16 Dec 2025
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status, notes)
  SELECT id, '2025-12-16', 500.00, 70.00, 0.00, 0.00, 'Delivered', 'Shipping was ₹70 in early orders'
  FROM customers WHERE phone = '8105571140'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Red Rose Soap', 2, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 13 — Samyuktha — 5 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-05', 500.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '8105571140'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Sheabutter – Kesar Gulab', 1, 400.00),
  ('Travel Soaps',             3,  50.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 14 — Lahri — 9 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-09', 500.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '8130382461'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Red Rose Soap', 2, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 15 — Snehal Rane — 10 Jan 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-01-10', 750.00, 100.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9594967734'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Turmeric Honey Goatmilk Soap',     1, 350.00),
  ('Honey Kesar Haldi Sheabutter Soap',1, 400.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 16 — Asha G — 23 Dec 2025
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2025-12-23', 1000.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '+16082590566'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Honey Oats Glycerin Soap',    2, 250.00),
  ('Honey Oats Goatmilk Soap',    1, 250.00),
  ('Ginger Rosemary Goatmilk Soap',1,250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 17 — Krithish Jain — 15 Feb 2026
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2026-02-15', 1000.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9884645000'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Neem & Tulsi Goatmilk Soap', 4, 250.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;

-- ORDER 18 — Shweta Kikla — 27 Dec 2025
WITH o AS (
  INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status)
  SELECT id, '2025-12-27', 1000.00, 0.00, 0.00, 0.00, 'Delivered'
  FROM customers WHERE phone = '9663199866'
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, p.id, i.qty, i.price
FROM o,
(VALUES
  ('Orange Goatmilk Soap',      1, 350.00),
  ('Rice & Rose Goatmilk Soap', 1, 350.00),
  ('Pomegranate Goatmilk Soap', 1, 350.00),
  ('Honey Oats Goatmilk Soap',  1, 350.00)
) AS i(name, qty, price)
JOIN products p ON p.name = i.name;


-- ============================================================
-- EXPENSES
-- Extracted from handwritten register (2 pages)
-- Dates left blank where not recorded — update in app later
-- ============================================================
INSERT INTO expenses (description, amount, expense_date, notes) VALUES
  ('Soap Essential (Suruchi)',      1836.00, '2025-12-01', 'Date approximate — please update'),
  ('Soap Mould',                   1170.00, '2025-12-01', 'Date approximate — please update'),
  ('DIY & Shopping',               1663.00, '2025-12-01', 'Moulds, storage organiser — date approximate'),
  ('Vista Print',                   330.00, '2025-12-01', 'Label & Stamp — date approximate'),
  ('Soap Making Course',            416.00, '2025-12-01', 'Date approximate — please update'),
  ('Eastern Store',                1919.00, '2025-12-01', 'Knife & Board — date approximate'),
  ('Packing Box (Small)',           144.00, '2025-12-01', 'Date approximate — please update'),
  ('Borosil Glass Jar (Big)',       828.00, '2025-12-01', 'Date approximate — please update'),
  ('Jute Twine',                    135.00, '2025-12-01', 'Date approximate — please update'),
  ('Borosil Glass Jar (Small)',     589.00, '2025-12-01', 'Date approximate — please update'),
  ('Packing Box (Big)',             242.00, '2025-12-01', 'Register shows 239 crossed to 242 — date approximate'),
  ('BECO Wrapping',                 175.00, '2025-12-01', 'Date approximate — please update'),
  ('Folding Table',                1600.00, '2025-12-01', 'Date approximate — please update'),
  ('Instagram Boost',              1285.00, '2025-12-01', 'Two boost entries in register — verify second amount'),
  ('Shipping Charges',              107.00, '2025-12-24', ''),
  ('Soap Base (Soapy Twist)',       995.00, '2025-12-26', ''),
  ('Packing Box',                   159.00, '2025-12-26', ''),
  ('Sealing Tape',                  269.00, '2026-01-21', ''),
  ('Cling Wrap',                    196.00, '2026-01-21', ''),
  ('Soap Base & Essential Oil',    2404.00, '2025-12-31', ''),
  ('Dept of Post — Shipping',       354.00, '2025-12-30', ''),
  ('Dept of Post — Shipping',       284.00, '2026-01-12', ''),
  ('Silicon Beaker',                284.00, '2026-01-12', ''),
  ('Kids Mould',                    329.00, '2026-01-12', ''),
  ('Isopropyl Alcohol',             351.00, '2026-01-12', ''),
  ('Google Ads',                   3000.00, '2026-01-04', ''),
  ('Sujatha Mixer',                 650.00, '2026-01-06', ''),
  ('Jute Bags',                     160.00, '2026-01-06', ''),
  ('Ayushi Fee',                   3200.00, '2026-01-06', ''),
  ('Malorie Hamper',                284.00, '2026-01-06', ''),
  ('Ayushi Hamper',                1150.00, '2026-01-06', '');


-- ============================================================
-- VERIFY — quick counts to confirm everything landed
-- ============================================================
SELECT 'customers'  AS table_name, COUNT(*) AS rows FROM customers
UNION ALL
SELECT 'orders',      COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'expenses',    COUNT(*) FROM expenses
UNION ALL
SELECT 'products',    COUNT(*) FROM products;

COMMIT;
