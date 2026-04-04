BEGIN;

CREATE TABLE outreach_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  outreach_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  response       TEXT CHECK (response IN ('pending', 'not_ready', 'ordered', 'no_response')),
  follow_up_date DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_log_customer ON outreach_log(customer_id);
CREATE INDEX idx_outreach_log_followup ON outreach_log(follow_up_date);

COMMIT;
