BEGIN;

-- MIGRATION v24 — Reliable Razorpay order lifecycle, an instant order
-- acceptance switch, and a consented capacity waitlist.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique
  ON customers (LOWER(email))
  WHERE email IS NOT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'Order Placed', 'Received', 'Awaiting Payment', 'Payment Confirmed',
    'In Manufacturing', 'Ready to Dispatch',
    'Dispatched', 'Partially Dispatched', 'Partially Delivered', 'Delivered',
    'Cancelled'
  ));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('unpaid', 'pending', 'manual', 'paid'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_order_id_unique
  ON orders (provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_payment_id_unique
  ON orders (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

INSERT INTO settings (key, value, description)
VALUES (
  'accepting_orders',
  'true',
  'Allow new website orders. Turn off to pause Razorpay and manual fallback immediately.'
)
ON CONFLICT (key) DO NOTHING;

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
  c.email AS customer_email
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

COMMIT;
