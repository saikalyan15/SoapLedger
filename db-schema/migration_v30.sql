BEGIN;

-- MIGRATION v30 — Stable website checkout sessions and Razorpay attempt history.
-- A checkout session identifies one intended basket. Multiple Razorpay payment
-- attempts may belong to that order, but concurrent retries cannot create a
-- second SoapLedger order for the same session.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS checkout_session_id UUID,
  ADD COLUMN IF NOT EXISTS checkout_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_session_id_unique
  ON orders(checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_order_id TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  method TEXT,
  error_code TEXT,
  error_description TEXT,
  error_source TEXT,
  error_step TEXT,
  error_reason TEXT,
  amount_paise BIGINT,
  currency TEXT,
  provider_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_attempts_provider_payment_id_unique UNIQUE (provider_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id
  ON payment_attempts(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_provider_order_id
  ON payment_attempts(provider_order_id);

-- Preserve the payment evidence already stored on legacy order rows.
INSERT INTO payment_attempts (
  order_id, provider_order_id, provider_payment_id, status, amount_paise,
  currency, provider_created_at, created_at, updated_at
)
SELECT id, provider_order_id, provider_payment_id, 'captured',
       ROUND(order_value * 100)::bigint, 'INR', paid_at,
       COALESCE(paid_at, created_at), COALESCE(paid_at, created_at)
FROM orders
WHERE payment_provider = 'razorpay'
  AND provider_order_id IS NOT NULL
  AND provider_payment_id IS NOT NULL
ON CONFLICT (provider_payment_id) DO NOTHING;

INSERT INTO payment_attempts (
  order_id, provider_order_id, provider_payment_id, status, method,
  error_code, error_description, error_source, error_step, error_reason,
  amount_paise, currency, provider_created_at, created_at, updated_at
)
SELECT id, provider_order_id, payment_failure_details->>'payment_id', 'failed',
       payment_failure_details->>'method', payment_failure_details->>'code',
       payment_failure_reason, payment_failure_details->>'source',
       payment_failure_details->>'step', payment_failure_details->>'reason',
       ROUND(order_value * 100)::bigint, 'INR', payment_failed_at,
       COALESCE(payment_failed_at, created_at), COALESCE(payment_failed_at, created_at)
FROM orders
WHERE payment_provider = 'razorpay'
  AND provider_order_id IS NOT NULL
  AND payment_failure_details->>'payment_id' ~ '^pay_[A-Za-z0-9]+$'
ON CONFLICT (provider_payment_id) DO NOTHING;

COMMIT;
