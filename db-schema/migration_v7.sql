-- ============================================================
-- MIGRATION v7.0 — Add customization_amount to orders
-- ============================================================

BEGIN;

ALTER TABLE orders
  ADD COLUMN customization_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- Recreate order_summary view to expose customization_amount
DROP VIEW order_summary;
CREATE VIEW order_summary AS
SELECT
  o.id,
  o.order_date,
  o.status,
  o.notes,
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
JOIN customers c ON c.id = o.customer_id;

COMMIT;
