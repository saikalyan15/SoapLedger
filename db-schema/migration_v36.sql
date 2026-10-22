BEGIN;

-- MIGRATION v36 — Recipient name + phone per shipment.
-- A multi-address order (e.g. a gift sent to a friend) ships to people other
-- than the customer who placed it, so each package needs its own recipient.
-- NULL recipient_name means the package goes to the customer themselves.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS recipient_name  TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

COMMIT;
