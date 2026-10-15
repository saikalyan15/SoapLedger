BEGIN;

-- MIGRATION v35 — Speed Post tracking ID per shipment.
-- Stored on shipments (not orders) because one order can ship as several
-- packages, each with its own consignment number. Optional free text, set
-- once a package is posted, so the owner can look it up when a customer asks
-- "where is my order?".

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS tracking_id TEXT;

COMMIT;
