-- ============================================================
-- MIGRATION v3.0 — Shipments & Multi-Address Support
-- ============================================================

-- 1. Create CUSTOMER_ADDRESSES for saved locations
CREATE TABLE IF NOT EXISTS customer_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         TEXT NOT NULL, -- e.g. "Home", "Mom's House"
  address_text  TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create SHIPMENTS table to track individual packages
CREATE TABLE IF NOT EXISTS shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Shipment 1',
  address_text    TEXT NOT NULL, -- Snapshot of destination
  status          TEXT NOT NULL DEFAULT 'Received'
                    CHECK (status IN ('Received', 'In Progress', 'Dispatched', 'Delivered')),
  dispatched_at   TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Prepare ORDER_ITEMS for shipment linking
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL;

-- 4. DATA MIGRATION: 
-- A. Create saved addresses for all existing customers
INSERT INTO customer_addresses (customer_id, label, address_text, is_default)
SELECT id, 'Primary', address, TRUE 
FROM customers 
WHERE address IS NOT NULL AND address <> ''
ON CONFLICT DO NOTHING;

-- B. Create a shipment for every existing order
-- We snapshot the address from the customer record at migration time
INSERT INTO shipments (order_id, status, address_text, label)
SELECT o.id, o.status, COALESCE(c.address, 'No Address Provided'), 'Primary Shipment'
FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- C. Link all existing items to their new shipments
UPDATE order_items oi
SET shipment_id = s.id
FROM shipments s
WHERE oi.order_id = s.order_id;

-- 5. UPGRADE VIEWS
DROP VIEW IF EXISTS order_summary;
CREATE VIEW order_summary AS
SELECT
  o.id,
  o.order_date,
  -- Overall status is now a summary of shipment statuses
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status != 'Delivered') THEN 'Delivered'
    WHEN EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'Delivered') THEN 'Partially Delivered'
    WHEN EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'Dispatched') THEN 'Partially Dispatched'
    ELSE o.status 
  END AS status,
  o.notes,
  o.created_at,
  o.order_value AS revenue,
  o.shipping_charge,
  o.packaging_cost,
  o.material_cost,
  (SELECT string_agg(address_text, ' | ') FROM shipments WHERE order_id = o.id) AS customer_address,
  c.id AS customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone
FROM orders o
JOIN customers c ON c.id = o.customer_id;

DROP VIEW IF EXISTS order_items_detail;
CREATE VIEW order_items_detail AS
SELECT
  oi.id,
  oi.order_id,
  oi.shipment_id,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) AS line_total,
  p.id AS product_id,
  p.name AS product_name,
  p.base_type,
  s.label AS shipment_label,
  s.status AS shipment_status
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN shipments s ON s.id = oi.shipment_id;
