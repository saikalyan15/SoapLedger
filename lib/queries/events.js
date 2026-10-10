import sql from '@/lib/db';

// A starting point, not a fixed list — every row this seeds is an ordinary
// editable checklist item the owner can rename, reorder, or delete per event.
// Covers running the stall itself, separate from which soaps to bring.
const DEFAULT_CHECKLIST_TEMPLATE = [
  'Table, cloth & display stands',
  'Price list / signage',
  'Cash float for change',
  'UPI/payment QR code displayed',
  'Bags or wrapping for sold soaps',
  'Business cards / flyers',
  'Social media handle or QR signage',
  'Phone charged for the sell screen',
  'Extension cord & lighting (if needed)',
  'Water, snacks & hand sanitizer',
];

export async function getAllEvents() {
  return await sql`
    SELECT
      e.*,
      COALESCE((SELECT SUM(quantity * unit_price) FROM event_sales WHERE event_id = e.id AND voided_at IS NULL), 0) as revenue,
      COALESCE((SELECT SUM(quantity) FROM event_sales WHERE event_id = e.id AND voided_at IS NULL), 0) as units_sold
    FROM events e
    ORDER BY e.date_from DESC, e.created_at DESC
  `;
}

export async function getEventById(id) {
  const [event] = await sql`SELECT * FROM events WHERE id = ${id}`;
  return event;
}

export async function createEvent(data) {
  const [event] = await sql`
    INSERT INTO events (name, location, date_from, date_to, notes)
    VALUES (${data.name}, ${data.location || null}, ${data.date_from}, ${data.date_to}, ${data.notes || null})
    RETURNING id
  `;
  for (let i = 0; i < DEFAULT_CHECKLIST_TEMPLATE.length; i += 1) {
    await sql`
      INSERT INTO event_checklist_items (event_id, label, sort_order)
      VALUES (${event.id}, ${DEFAULT_CHECKLIST_TEMPLATE[i]}, ${i})
    `;
  }
  return event.id;
}

export async function getEventChecklist(eventId) {
  return await sql`
    SELECT * FROM event_checklist_items
    WHERE event_id = ${eventId}
    ORDER BY sort_order ASC, created_at ASC
  `;
}

export async function addChecklistItem(eventId, label) {
  const [{ next_order } = {}] = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
    FROM event_checklist_items WHERE event_id = ${eventId}
  `;
  const [item] = await sql`
    INSERT INTO event_checklist_items (event_id, label, sort_order)
    VALUES (${eventId}, ${label}, ${next_order})
    RETURNING id
  `;
  return item.id;
}

export async function toggleChecklistItem(itemId, isDone) {
  await sql`UPDATE event_checklist_items SET is_done = ${isDone} WHERE id = ${itemId}`;
}

export async function deleteChecklistItem(itemId) {
  await sql`DELETE FROM event_checklist_items WHERE id = ${itemId}`;
}

export async function updateEvent(id, data) {
  await sql`
    UPDATE events SET
      name = ${data.name},
      location = ${data.location || null},
      date_from = ${data.date_from},
      date_to = ${data.date_to},
      status = ${data.status},
      cash_counted = ${data.cash_counted ?? null},
      notes = ${data.notes || null}
    WHERE id = ${id}
  `;
}

export async function updateStallFee(eventId, fee) {
  await sql`UPDATE events SET stall_fee = ${fee} WHERE id = ${eventId}`;
}

export async function deleteEvent(id) {
  const [existing] = await sql`SELECT status FROM events WHERE id = ${id}`;
  if (existing && existing.status !== 'Planning') {
    throw new Error(`Cannot delete an event in ${existing.status} status`);
  }
  await sql`DELETE FROM events WHERE id = ${id}`;
}

// Proportional allocation of a target total unit count across the SOAP
// category only — Balm/Gift Set/Other products always come back at
// recommended_quantity: 0 (the owner sets those manually; they're low-volume,
// gut-feel items not worth a second parallel target/distribution system).
// No ML — just a reasonable starting point the owner can override, add to,
// or remove from line by line. Every product is returned (including
// inactive/seasonal ones and non-Soap types) so the planning page can offer
// them all as opt-in.
//
// Deliberately does NOT use made-to-order order_items history as a basis —
// the owner's regular repeat customers skew toward customized orders (e.g.
// fragrance-free for allergies) that don't represent a walk-in stall
// audience at all. Past EVENT sales are a true walk-in signal and are used
// once they exist; for a first event with no stall history yet, the target
// is split evenly across base_type FAMILIES first (Glycerine, Goat Milk,
// Shea Butter, ...), then evenly within each family's own variants — a flat
// per-product split would let a family with more SKUs (Goat Milk has ~7)
// dominate the table purely by variant count, not genuine appeal, and would
// leave the stall visually lopsided too.
export async function getEventRecommendations(eventId, targetTotalUnits) {
  const target = Math.max(0, Number(targetTotalUnits) || 0);

  const products = await sql`
    SELECT id, name, base_type, weight_grams, unit_price, is_active, product_type
    FROM products
    ORDER BY is_active DESC, product_type, base_type, name
  `;
  if (products.length === 0 || target === 0) {
    return products.map((p) => ({ ...p, recommended_quantity: 0 }));
  }

  const activeSoapByBaseType = new Map();
  products.filter((p) => p.is_active && p.product_type === 'Soap').forEach((p) => {
    if (!activeSoapByBaseType.has(p.base_type)) activeSoapByBaseType.set(p.base_type, []);
    activeSoapByBaseType.get(p.base_type).push(p);
  });
  const baseTypeCount = activeSoapByBaseType.size;
  if (baseTypeCount === 0) {
    return products.map((p) => ({ ...p, recommended_quantity: 0 }));
  }

  // Past event sell-through, if this isn't the owner's first event.
  const eventHistory = await sql`
    SELECT product_id, SUM(quantity) as units
    FROM event_sales
    WHERE voided_at IS NULL AND event_id != ${eventId}
    GROUP BY product_id
  `;
  const eventHistoryMap = new Map(eventHistory.map((r) => [r.product_id, parseFloat(r.units)]));
  const eventHistoryTotal = eventHistory.reduce((sum, r) => sum + parseFloat(r.units), 0);
  const useEventHistory = eventHistoryTotal > 0;

  // Products that sold out at a past event — true demand is unknown, so nudge up.
  const soldOutProductIds = new Set(
    (await sql`
      SELECT DISTINCT ei.product_id
      FROM event_inventory ei
      WHERE ei.event_id != ${eventId} AND ei.closing_count = 0
    `).map((r) => r.product_id)
  );

  return products.map((p) => {
    if (!p.is_active || p.product_type !== 'Soap') return { ...p, recommended_quantity: 0 };

    const share = useEventHistory
      ? (eventHistoryMap.get(p.id) || 0) / eventHistoryTotal
      : (1 / baseTypeCount) * (1 / activeSoapByBaseType.get(p.base_type).length);

    let recommended = Math.round(target * share);
    if (recommended === 0 && share > 0) recommended = 1; // floor for any product with a real signal
    if (soldOutProductIds.has(p.id)) recommended = Math.ceil(recommended * 1.15);

    return { ...p, recommended_quantity: recommended };
  });
}

export async function getEventInventory(eventId) {
  return await sql`
    SELECT
      ei.*,
      p.name, p.base_type, p.weight_grams, p.product_type
    FROM event_inventory ei
    JOIN products p ON p.id = ei.product_id
    WHERE ei.event_id = ${eventId}
    ORDER BY p.product_type, p.base_type, p.name
  `;
}

// `rows` is the full set of products the owner has checked "in" for this
// event. Anything previously planned but no longer checked gets removed —
// unless it already has sales logged, in which case it's kept so the
// summary page never loses a sold product's record.
export async function savePlannedInventory(eventId, rows) {
  const includedProductIds = rows.map((r) => r.product_id);

  // Split in two (rather than `!= ALL(${[]})`) to avoid Postgres failing to
  // infer the empty array's element type when nothing is checked at all.
  if (includedProductIds.length === 0) {
    await sql`
      DELETE FROM event_inventory
      WHERE event_id = ${eventId}
        AND NOT EXISTS (
          SELECT 1 FROM event_sales
          WHERE event_sales.event_id = event_inventory.event_id
            AND event_sales.product_id = event_inventory.product_id
            AND event_sales.voided_at IS NULL
        )
    `;
  } else {
    await sql`
      DELETE FROM event_inventory
      WHERE event_id = ${eventId}
        AND product_id != ALL(${includedProductIds})
        AND NOT EXISTS (
          SELECT 1 FROM event_sales
          WHERE event_sales.event_id = event_inventory.event_id
            AND event_sales.product_id = event_inventory.product_id
            AND event_sales.voided_at IS NULL
        )
    `;
  }

  for (const row of rows) {
    await sql`
      INSERT INTO event_inventory (event_id, product_id, recommended_quantity, planned_quantity, unit_price, in_stock_quantity)
      VALUES (${eventId}, ${row.product_id}, ${row.recommended_quantity || 0}, ${row.planned_quantity || 0}, ${row.unit_price}, ${row.in_stock_quantity || 0})
      ON CONFLICT (event_id, product_id) DO UPDATE SET
        recommended_quantity = EXCLUDED.recommended_quantity,
        planned_quantity = EXCLUDED.planned_quantity,
        unit_price = EXCLUDED.unit_price,
        in_stock_quantity = EXCLUDED.in_stock_quantity
    `;
  }
}

export async function logEventSale(eventId, productId, quantity, paymentMethod) {
  const [inventoryRow] = await sql`
    SELECT unit_price FROM event_inventory WHERE event_id = ${eventId} AND product_id = ${productId}
  `;
  const unitPrice = inventoryRow
    ? inventoryRow.unit_price
    : (await sql`SELECT unit_price FROM products WHERE id = ${productId}`)[0]?.unit_price;

  const [sale] = await sql`
    INSERT INTO event_sales (event_id, product_id, quantity, unit_price, payment_method)
    VALUES (${eventId}, ${productId}, ${quantity || 1}, ${unitPrice}, ${paymentMethod || 'cash'})
    RETURNING id
  `;
  return sale.id;
}

export async function undoLastEventSale(eventId) {
  const [lastSale] = await sql`
    SELECT id FROM event_sales
    WHERE event_id = ${eventId} AND voided_at IS NULL
    ORDER BY sold_at DESC
    LIMIT 1
  `;
  if (!lastSale) return null;
  await sql`UPDATE event_sales SET voided_at = NOW() WHERE id = ${lastSale.id}`;
  return lastSale.id;
}

export async function getEventSales(eventId) {
  return await sql`
    SELECT es.*, p.name, p.base_type
    FROM event_sales es
    JOIN products p ON p.id = es.product_id
    WHERE es.event_id = ${eventId} AND es.voided_at IS NULL
    ORDER BY es.sold_at DESC
  `;
}

export async function getEventSummary(eventId) {
  const event = await getEventById(eventId);
  const rows = await sql`
    SELECT
      ei.product_id,
      p.name, p.base_type, p.weight_grams, p.product_type,
      ei.planned_quantity,
      ei.unit_price,
      ei.closing_count,
      ei.in_stock_quantity,
      COALESCE((
        SELECT SUM(quantity) FROM event_sales
        WHERE event_id = ei.event_id AND product_id = ei.product_id AND voided_at IS NULL
      ), 0) as sold_quantity
    FROM event_inventory ei
    JOIN products p ON p.id = ei.product_id
    WHERE ei.event_id = ${eventId}
    ORDER BY p.product_type, p.base_type, p.name
  `;

  const items = rows.map((r) => ({
    ...r,
    planned_quantity: parseInt(r.planned_quantity),
    sold_quantity: parseInt(r.sold_quantity),
    in_stock_quantity: parseInt(r.in_stock_quantity),
    remaining: parseInt(r.planned_quantity) - parseInt(r.sold_quantity),
    revenue: parseInt(r.sold_quantity) * parseFloat(r.unit_price),
  }));

  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
  const totalUnitsSold = items.reduce((sum, i) => sum + i.sold_quantity, 0);
  const cashCounted = event?.cash_counted == null ? null : parseFloat(event.cash_counted);

  return {
    event,
    items,
    total_revenue: totalRevenue,
    total_units_sold: totalUnitsSold,
    cash_counted: cashCounted,
    cash_diff: cashCounted == null ? null : cashCounted - totalRevenue,
  };
}

export async function recordClosingCounts(eventId, rows) {
  for (const row of rows) {
    await sql`
      UPDATE event_inventory
      SET closing_count = ${row.closing_count}
      WHERE event_id = ${eventId} AND product_id = ${row.product_id}
    `;
  }
}

export async function recordCashCounted(eventId, cashCounted) {
  await sql`UPDATE events SET cash_counted = ${cashCounted} WHERE id = ${eventId}`;
}
