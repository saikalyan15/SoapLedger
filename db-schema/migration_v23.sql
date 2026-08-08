BEGIN;

-- MIGRATION v23 — Persist website acquisition attribution on orders.
-- The JSONB document contains first/last touch campaign data and Meta browser
-- identifiers. It deliberately excludes customer IP addresses and user agents.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS attribution JSONB;

CREATE OR REPLACE VIEW order_summary AS
SELECT
  o.id,
  o.order_date,
  o.status,
  o.notes,
  o.source,
  o.created_at,
  o.order_value AS revenue,
  o.shipping_charge,
  o.packaging_cost,
  o.material_cost,
  o.customization_amount,
  (o.packaging_cost + o.material_cost) AS operational_cost,
  (o.order_value - o.packaging_cost - o.material_cost) AS gross_profit,
  c.id AS customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.address AS customer_address,
  o.attribution
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

COMMIT;
