BEGIN;

-- MIGRATION v33 — Stall setup checklist, and a stall fee + break-even figure.
-- Checklist covers everything a stall needs besides soaps (table, signage,
-- payment QR, marketing materials, etc). Seeded with sensible defaults on
-- event creation, but every row is just data — add, rename, reorder, or
-- delete freely per event rather than a fixed list baked into the app.
-- stall_fee lets the owner work out the minimum units they must sell to
-- cover the cost of the stall itself, computed from planned pricing.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS stall_fee NUMERIC(10, 2);

CREATE TABLE event_checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_checklist_items_event_id ON event_checklist_items(event_id, sort_order);

COMMIT;
