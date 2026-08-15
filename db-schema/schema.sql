-- ============================================================
-- SOAPLEDGER — Healing Soil Business Operations Tracker
-- PostgreSQL Schema v1.0 — FINAL
-- Paste this entire file into Neon SQL Editor and run once
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- PRODUCTS
-- Current catalogue. unit_price = current price only.
-- Historical prices are snapshotted on order_items at order time.
-- ============================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  base_type     TEXT NOT NULL,       -- e.g. Glycerine, Goat Milk, Shea Butter, Loofah, Travel, Red Wine, Other
  weight_grams  INTEGER,
  unit_price    NUMERIC(10, 2) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_seasonal   BOOLEAN NOT NULL DEFAULT FALSE,
  is_wholesale_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO products (name, base_type, weight_grams, unit_price, is_active, is_seasonal) VALUES
  ('Neem Tulsi Glycerin Soap',       'Glycerine',   100, 250.00, TRUE,  FALSE),
  ('Honey Oats Glycerin Soap',       'Glycerine',   100, 250.00, TRUE,  FALSE),
  ('Ginger Rosemary Glycerin Soap',  'Glycerine',   100, 250.00, TRUE,  FALSE),
  ('Orange Goatmilk Soap',           'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Neem & Tulsi Goatmilk Soap',     'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Ginger Rosemary Goat Milk Soap', 'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Honey and Oats Goatmilk Soap',   'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Pomegranate Goatmilk Soap',      'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Kesar-Haldi Soap',               'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Rice & Rose Goatmilk Soap',      'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Turmeric Honey Goatmilk Soap',   'Goat Milk',   100, 350.00, TRUE,  FALSE),
  ('Sheabutter – Kesar Gulab',       'Shea Butter', 100, 400.00, TRUE,  FALSE),
  ('Sheabutter – Turmeric Gulab',    'Shea Butter', 100, 400.00, TRUE,  FALSE),
  ('Loofah Soaps',                   'Loofah',      150, 500.00, TRUE,  FALSE),
  ('Travel Soaps',                   'Travel',       30,  50.00, TRUE,  FALSE),
  ('Red Rose Soap',                  'Red Wine',    100, 250.00, TRUE,  TRUE),
  ('Valentines Special Soap',        'Red Wine',    100, 300.00, FALSE, TRUE);


-- ============================================================
-- CUSTOMERS
-- Phone is the unique identifier — WhatsApp number.
-- ============================================================
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL UNIQUE,
  email       TEXT UNIQUE,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX customers_email_unique ON customers (LOWER(email)) WHERE email IS NOT NULL;


-- ============================================================
-- RAW MATERIALS
-- Each row = one procurement event, not a material type.
-- total_cost is auto-calculated (quantity × unit_cost).
-- ============================================================
CREATE TABLE raw_materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,        -- Soap Base, Add-in & Active, Fragrance & EO, Packaging, Other
  quantity     NUMERIC(10, 3) NOT NULL,
  unit         TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'ml', 'pieces')),
  unit_cost    NUMERIC(10, 2) NOT NULL,
  total_cost   NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  procured_on  DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- EXPENSES
-- All business costs not tied to a specific order.
-- Keep it simple — description, amount, date.
-- Feeds the blended cost-per-soap calculation on the dashboard.
-- ============================================================
CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description   TEXT NOT NULL,
  amount        NUMERIC(10, 2) NOT NULL,
  expense_date  DATE NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ORDERS
-- One row per customer order.
-- Shipping is pass-through — not revenue, not cost.
-- material_cost and packaging_cost entered manually per order.
-- ============================================================
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  order_date      DATE NOT NULL,
  order_value     NUMERIC(10, 2) NOT NULL,
  shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  packaging_cost  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  material_cost   NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status          TEXT NOT NULL DEFAULT 'Order Placed'
                    CHECK (status IN ('Order Placed', 'Received', 'Awaiting Payment', 'Payment Confirmed', 'In Manufacturing', 'Ready to Dispatch', 'Dispatched', 'Partially Dispatched', 'Partially Delivered', 'Delivered', 'Cancelled')),
  source          TEXT,
  attribution     JSONB,
  payment_provider TEXT,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  checkout_session_id UUID,
  checkout_fingerprint TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'unpaid'
                    CHECK (payment_status IN ('unpaid', 'pending', 'failed', 'manual', 'paid')),
  paid_at         TIMESTAMPTZ,
  payment_failed_at TIMESTAMPTZ,
  payment_failure_reason TEXT,
  payment_failure_details JSONB,
  interest_contact_channel TEXT CHECK (interest_contact_channel IS NULL OR interest_contact_channel = 'whatsapp'),
  interest_consent_at TIMESTAMPTZ,
  interest_contacted_at TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX orders_checkout_session_id_unique
  ON orders(checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

-- One row per Razorpay payment attempt. A single Razorpay order can have
-- several attempts, each with its own pay_... identifier.
CREATE TABLE payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_order_id TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  method TEXT,
  error_code TEXT,
  error_description TEXT,
  error_source TEXT,
  error_step TEXT,
  error_reason TEXT,
  amount_paise BIGINT,
  currency TEXT,
  provider_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ORDER ITEMS
-- One row per product line in an order.
-- CRITICAL: unit_price must be snapshotted at order time.
-- Never join back to products.unit_price for any calculation.
-- ============================================================
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10, 2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SETTINGS
-- App-wide defaults. Editable from the settings screen.
-- ============================================================
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT
);

INSERT INTO settings (key, value, description) VALUES
  ('default_packaging_cost',  '30',   'Default packaging cost per order in INR'),
  ('free_shipping_threshold', '1000', 'Orders at or above this value get free shipping'),
  ('shipping_charge_below',   '100',  'Shipping charge for orders below the threshold'),
  ('accepting_orders',         'true', 'Allow new website orders. Turn off to pause Razorpay and manual fallback immediately.'),
  ('orders_reopen_date',       '',     'Optional estimated website-order reopening date (YYYY-MM-DD). Ordering resumes only through the manual switch.');


-- ============================================================
-- VIEWS — convenience queries used throughout the app
-- ============================================================

-- Full order summary with profit calculations
CREATE VIEW order_summary AS
SELECT
  o.id,
  o.order_date,
  o.status,
  o.notes,
  o.source,
  o.created_at,
  o.order_value                                          AS revenue,
  o.shipping_charge,
  o.packaging_cost,
  o.material_cost,
  (o.packaging_cost + o.material_cost)                   AS operational_cost,
  (o.order_value - o.packaging_cost - o.material_cost)   AS gross_profit,
  c.id                                                   AS customer_id,
  c.name                                                 AS customer_name,
  c.phone                                                AS customer_phone,
  c.address                                              AS customer_address,
  o.attribution,
  o.payment_provider,
  o.provider_order_id,
  o.provider_payment_id,
  o.payment_status,
  o.paid_at,
  c.email                                                AS customer_email,
  o.payment_failed_at,
  o.payment_failure_reason,
  o.payment_failure_details,
  o.checkout_session_id,
  o.checkout_fingerprint,
  o.interest_contact_channel,
  o.interest_consent_at,
  o.interest_contacted_at
FROM orders o
JOIN customers c ON c.id = o.customer_id;

-- Order line items with product details
CREATE VIEW order_items_detail AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price)  AS line_total,
  p.id                           AS product_id,
  p.name                         AS product_name,
  p.base_type,
  p.is_seasonal
FROM order_items oi
JOIN products p ON p.id = oi.product_id;


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_order_date     ON orders(order_date);
CREATE INDEX idx_orders_customer_id    ON orders(customer_id);
CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_order_items_order_id  ON order_items(order_id);
CREATE INDEX idx_order_items_product   ON order_items(product_id);
CREATE INDEX idx_payment_attempts_order_id ON payment_attempts(order_id, created_at DESC);
CREATE INDEX idx_payment_attempts_provider_order_id ON payment_attempts(provider_order_id);
CREATE INDEX idx_raw_materials_date    ON raw_materials(procured_on);
CREATE INDEX idx_customers_phone       ON customers(phone);
CREATE INDEX idx_expenses_date         ON expenses(expense_date);

-- ============================================================
-- END OF SCHEMA
-- All done. You should now see 7 tables and 2 views in Neon.
-- Tables: products, customers, raw_materials, expenses,
--         orders, order_items, settings
-- Views:  order_summary, order_items_detail
-- ============================================================
