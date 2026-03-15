-- ============================================================
-- MIGRATION v5.0 — UI Visibility & View Resilience Fixes
-- ============================================================

BEGIN;

-- 1. DROP old views to recreate them with better logic
DROP VIEW IF EXISTS order_items_detail CASCADE;
DROP VIEW IF EXISTS order_summary CASCADE;

-- 2. Recreate ORDER_SUMMARY with LEFT JOIN and Status Fallback
-- This ensures orders show up even if a customer is accidentally deleted
-- or if the complex shipment status logic returns NULL.
CREATE VIEW order_summary AS
SELECT
  o.id,
  o.order_date,
  -- Improved Status Logic with Fallback
  COALESCE(
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status != 'Delivered') 
           AND EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id) THEN 'Delivered'
      
      WHEN EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'Delivered') 
           AND EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status != 'Delivered') THEN 'Partially Delivered'
      
      WHEN EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status = 'Dispatched')
           AND EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id AND s.status NOT IN ('Dispatched', 'Delivered')) THEN 'Partially Dispatched'
      
      ELSE (SELECT status FROM shipments WHERE order_id = o.id ORDER BY 
        CASE status 
          WHEN 'Delivered' THEN 4 
          WHEN 'Dispatched' THEN 3 
          WHEN 'Ready to Dispatch' THEN 2 
          WHEN 'In Manufacturing' THEN 1 
          ELSE 0 
        END DESC LIMIT 1)
    END,
    o.status -- FALLBACK to the original status in orders table if logic above yields NULL
  ) AS status,
  o.notes,
  o.created_at,
  o.order_value AS revenue,
  o.shipping_charge,
  o.packaging_cost,
  o.material_cost,
  (SELECT string_agg(address_text, ' | ') FROM shipments WHERE order_id = o.id) AS customer_address,
  c.id AS customer_id,
  COALESCE(c.name, 'Unknown Customer') AS customer_name,
  COALESCE(c.phone, 'No Phone') AS customer_phone
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

-- 3. Recreate ORDER_ITEMS_DETAIL with LEFT JOINs
-- This ensures items show up even if a product is deleted (shows as Unknown Product)
CREATE VIEW order_items_detail AS
SELECT
  oi.id,
  oi.order_id,
  oi.shipment_id,
  oi.quantity,
  oi.unit_price,
  (oi.quantity * oi.unit_price) AS line_total,
  p.id AS product_id,
  COALESCE(p.name, 'Unknown Product') AS product_name,
  COALESCE(p.base_type, 'Other') AS base_type,
  s.label AS shipment_label,
  s.status AS shipment_status
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN shipments s ON s.id = oi.shipment_id;

COMMIT;
