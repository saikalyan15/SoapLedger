BEGIN;

ALTER TABLE essential_oils
  ADD COLUMN IF NOT EXISTS is_frequently_used BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_eo_frequently_used
  ON essential_oils (is_frequently_used);

COMMIT;
