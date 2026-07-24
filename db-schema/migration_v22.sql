BEGIN;

-- MIGRATION v22 — Add city + state to shipments
-- Enables the "orders by state/city" dashboard map. Previously only a free-text
-- address_text existed, with no structured location to aggregate on.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS city  TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

CREATE INDEX IF NOT EXISTS idx_shipments_state ON shipments(state);

COMMIT;
