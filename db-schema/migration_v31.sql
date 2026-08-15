BEGIN;

-- MIGRATION v31 — WhatsApp expression-of-interest workflow and an optional
-- customer-facing reopening date. The date never changes order availability;
-- accepting_orders remains the only switch that can reopen checkout.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS interest_contact_channel TEXT,
  ADD COLUMN IF NOT EXISTS interest_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interest_contacted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_interest_contact_channel_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_interest_contact_channel_check
      CHECK (interest_contact_channel IS NULL OR interest_contact_channel = 'whatsapp');
  END IF;
END $$;

INSERT INTO settings (key, value, description)
VALUES (
  'orders_reopen_date',
  '',
  'Optional estimated website-order reopening date (YYYY-MM-DD). Ordering resumes only through the manual switch.'
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
  c.email AS customer_email,
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

COMMIT;
