-- Phase 1 storage: raw GSC data, orders, and blog posts fetched on demand
-- Only one row at a time (purge before insert)
CREATE TABLE IF NOT EXISTS growth_gsc_data (
  id          SERIAL PRIMARY KEY,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_from   DATE NOT NULL,
  data_to     DATE NOT NULL,
  queries     JSONB,
  pages       JSONB,
  orders      JSONB,
  blog_posts  JSONB
);

-- Track which AI provider generated each insight, and which GSC snapshot it was based on
ALTER TABLE growth_insights
  ADD COLUMN IF NOT EXISTS provider    TEXT DEFAULT 'gemini',
  ADD COLUMN IF NOT EXISTS gsc_data_id INTEGER REFERENCES growth_gsc_data(id);
