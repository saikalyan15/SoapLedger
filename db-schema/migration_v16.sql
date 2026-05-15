BEGIN;

-- MIGRATION v16.0 — Simplify order_summary view to use orders.status as single source of truth
-- This fixes the issue where the list page status diverged from the order details status.

DROP VIEW IF EXISTS order_summary CASCADE;

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
  o.customization_amount,
  (o.packaging_cost + o.material_cost)                   AS operational_cost,
  (o.order_value - o.packaging_cost - o.material_cost)   AS gross_profit,
  c.id                                                   AS customer_id,
  c.name                                                 AS customer_name,
  c.phone                                                AS customer_phone,
  c.address                                              AS customer_address
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

-- Recreate order_items_detail as it depended on order_summary (via CASCADE) 
-- OR if it didn't, we still want to ensure it's correct.
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
  COALESCE(p.name, 'Unknown Product') AS product_name,
  COALESCE(p.base_type, 'Other') AS base_type,
  s.label AS shipment_label,
  s.status AS shipment_status
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN shipments s ON s.id = oi.shipment_id;

COMMIT;
