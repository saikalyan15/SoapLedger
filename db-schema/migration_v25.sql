BEGIN;

-- MIGRATION v25 — Record Razorpay failures without cancelling an order.
-- A failed attempt can still be followed by a captured payment, so the order
-- remains Awaiting Payment and the paid transition always wins.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'pending', 'failed', 'manual', 'paid'));

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
  o.payment_failure_reason
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

COMMIT;
