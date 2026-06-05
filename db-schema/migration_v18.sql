BEGIN;

-- MIGRATION v18 — Add outreach_type to outreach_log
-- Distinguishes reorder nudges from referral asks so both can be tracked
-- independently without a separate table.
ALTER TABLE outreach_log
  ADD COLUMN outreach_type TEXT NOT NULL DEFAULT 'reorder'
    CHECK (outreach_type IN ('reorder', 'referral'));

COMMIT;
