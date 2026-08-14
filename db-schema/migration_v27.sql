BEGIN;

-- MIGRATION v27 — Preserve safe Razorpay failure diagnostics for support.
-- This intentionally excludes card, bank-account and UPI identity data.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_failure_details JSONB;

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
  o.attribution,
  o.payment_provider,
  o.provider_order_id,
  o.provider_payment_id,
  o.payment_status,
  o.paid_at,
  c.email AS customer_email,
  o.payment_failed_at,
  o.payment_failure_reason,
  o.payment_failure_details
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

COMMIT;
