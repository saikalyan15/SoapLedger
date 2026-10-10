BEGIN;

-- MIGRATION v32 — Event inventory planning + walk-in sale capture.
-- Deliberately separate from orders/order_items/shipments: event sales are
-- walk-in (no customer record, no dispatch pipeline) and must never be
-- counted in the made-to-order revenue/earnings KPIs on the main dashboard.

-- ============================================================
-- EVENTS
-- One row per pop-up / craft fair. date_from/date_to supports single-day
-- (both equal) and multi-day events without a separate day-breakdown table.
-- ============================================================
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  location      TEXT,
  date_from     DATE NOT NULL,
  date_to       DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Planning'
                  CHECK (status IN ('Planning', 'Ready', 'In Progress', 'Completed', 'Cancelled')),
  cash_counted  NUMERIC(10, 2),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENT INVENTORY
-- Per-event planned stock per product. FK to products — no parallel catalog.
-- unit_price defaults from products.unit_price but is editable per event
-- (round cash prices, fair-specific deals). recommended_quantity is frozen
-- once computed so the planning page can show "recommended vs actual" even
-- after the owner overrides planned_quantity.
-- ============================================================
CREATE TABLE event_inventory (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  recommended_quantity  INTEGER NOT NULL DEFAULT 0 CHECK (recommended_quantity >= 0),
  planned_quantity      INTEGER NOT NULL DEFAULT 0 CHECK (planned_quantity >= 0),
  unit_price            NUMERIC(10, 2) NOT NULL,
  closing_count         INTEGER CHECK (closing_count >= 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_inventory_event_product_unique UNIQUE (event_id, product_id)
);

-- ============================================================
-- EVENT SALES
-- One row per walk-in sale (tap-to-log). No customer FK — walk-ins are
-- anonymous by design. unit_price is snapshotted per sale since it may
-- differ from event_inventory.unit_price if changed mid-event.
-- ============================================================
CREATE TABLE event_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      NUMERIC(10, 2) NOT NULL,
  payment_method  TEXT NOT NULL DEFAULT 'cash'
                    CHECK (payment_method IN ('cash', 'upi', 'card', 'other')),
  sold_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voided_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_event_inventory_event_id ON event_inventory(event_id);
CREATE INDEX idx_event_inventory_product_id ON event_inventory(product_id);
CREATE INDEX idx_event_sales_event_id ON event_sales(event_id, sold_at DESC);
CREATE INDEX idx_event_sales_product_id ON event_sales(product_id);
CREATE INDEX idx_events_date_from ON events(date_from);

COMMIT;
