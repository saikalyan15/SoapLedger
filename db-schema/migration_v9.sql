CREATE TABLE IF NOT EXISTS growth_insights (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_from    DATE NOT NULL,
  data_to      DATE NOT NULL,
  analysis     TEXT,
  observations JSONB,
  actions      JSONB NOT NULL,
  raw_input    JSONB
);
