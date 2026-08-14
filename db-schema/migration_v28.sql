BEGIN;

-- MIGRATION v28 — Workflow advancement confirms payments.
-- Existing paid-at dates are preserved. Historical orders are not assigned a
-- guessed payment timestamp when the actual receipt time is unknown.

UPDATE orders
SET payment_status = 'manual'
WHERE order_value > 0
  AND payment_status NOT IN ('paid', 'manual')
  AND status IN (
    'Payment Confirmed',
    'In Manufacturing',
    'Ready to Dispatch',
    'Dispatched',
    'Partially Dispatched',
    'Partially Delivered',
    'Delivered'
  );

COMMIT;
