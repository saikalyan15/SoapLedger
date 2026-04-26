BEGIN;

-- Essential oils catalogue
CREATE TABLE essential_oils (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  notes        TEXT,
  quantity_ml  NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: which oils belong to which product
CREATE TABLE product_essential_oils (
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  essential_oil_id  UUID NOT NULL REFERENCES essential_oils(id) ON DELETE CASCADE,
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (product_id, essential_oil_id)
);

-- At most one default oil per product
CREATE UNIQUE INDEX idx_peo_one_default_per_product
  ON product_essential_oils (product_id)
  WHERE is_default = TRUE;

CREATE INDEX idx_peo_product ON product_essential_oils(product_id);
CREATE INDEX idx_peo_oil     ON product_essential_oils(essential_oil_id);

COMMIT;
