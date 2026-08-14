BEGIN;

-- MIGRATION v29 — Undo workflow-based confirmation of unresolved Razorpay orders.
-- Razorpay orders are paid only after a verified captured payment. Manual
-- fallback changes payment_provider to 'manual', so it is not affected here.

WITH corrected_orders AS (
  UPDATE orders
  SET
    status = 'Awaiting Payment',
    payment_status = 'pending',
    paid_at = NULL
  WHERE payment_provider = 'razorpay'
    AND payment_status = 'manual'
    AND provider_payment_id IS NULL
  RETURNING id
)
UPDATE shipments
SET status = 'Awaiting Payment'
WHERE order_id IN (SELECT id FROM corrected_orders);

COMMIT;
