-- ============================================================
-- MIGRATION v3.0 — Shipments & Multi-Address Support (FINAL FIX)
-- ============================================================

-- 0. CLEANUP (In case of previous failed attempts)
DROP VIEW IF EXISTS order_items_detail CASCADE;
DROP VIEW IF EXISTS order_summary CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;

-- 1. Create CUSTOMER_ADDRESSES for saved locations
CREATE TABLE customer_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         TEXT NOT NULL, 
  address_text  TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create SHIPMENTS table WITHOUT strict CHECK constraint
CREATE TABLE shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label           TEXT NOT NULL DEFAULT 'Shipment 1',
  address_text    TEXT NOT NULL, 
  status          TEXT NOT NULL,
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
CREATE VIEW order_summary AS
SELECT
  o.id,
  o.order_date,
  -- Improved Status Logic for both single and multi-shipment orders
  CASE 
    -- 1. If ALL shipments are Delivered -> Delivered
    WHEN NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status != 'Delivered') THEN 'Delivered'
    
    -- 2. If some are Delivered but some are not -> Partially Delivered
    WHEN EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'Delivered') 
         AND EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status != 'Delivered') THEN 'Partially Delivered'
    
    -- 3. If some are Dispatched but some are not -> Partially Dispatched
    WHEN EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'Dispatched')
         AND EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status NOT IN ('Dispatched', 'Delivered')) THEN 'Partially Dispatched'
    
    -- 4. Otherwise, show the status of the most 'advanced' shipment
    ELSE (SELECT status FROM shipments WHERE order_id = o.id ORDER BY 
      CASE status 
        WHEN 'Delivered' THEN 4 
        WHEN 'Dispatched' THEN 3 
        WHEN 'Ready to Dispatch' THEN 2 
        WHEN 'In Manufacturing' THEN 1 
        ELSE 0 
      END DESC LIMIT 1)
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
