-- ============================================================
-- MIGRATION v4.0 — API Extensions & Schema Updates
-- ============================================================

BEGIN;

-- 1. Relax status check on orders to include 'Order Placed' and others
-- First, drop the old constraint (it was named implicitly or from schema.sql)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'Order Placed', 'Received', 'Awaiting Payment', 'Payment Confirmed', 
    'In Manufacturing', 'Ready to Dispatch', 'Dispatched', 'Delivered'
  ));

COMMIT;
