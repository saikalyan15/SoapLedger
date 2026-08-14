import sql from '@/lib/db';

const REQUIRED_TABLES = [
  'expense_categories', 'products', 'customers', 'settings',
  'customer_addresses', 'orders', 'shipments', 'order_items', 'expenses',
];

export async function POST(request) {
  let backup;
  try {
    backup = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON — could not parse backup file.' }, { status: 400 });
  }

  // Validate structure
  if (!backup || backup.app !== 'SoapLedger' || !backup.version || !backup.tables) {
    return Response.json({ error: 'Invalid backup file. This file was not exported from SoapLedger.' }, { status: 400 });
  }

  for (const table of REQUIRED_TABLES) {
    if (!Array.isArray(backup.tables[table])) {
      return Response.json({ error: `Backup is missing table: "${table}". File may be corrupt.` }, { status: 400 });
    }
  }

  const { expense_categories, products, customers, settings, customer_addresses, orders, shipments, order_items, expenses } = backup.tables;
  const payment_attempts = Array.isArray(backup.tables.payment_attempts) ? backup.tables.payment_attempts : [];

  try {
    // Build all queries as an array for a single atomic transaction
    const queries = [
      // ── Step 1: Clear all data in reverse FK order ──────────────────
      sql`DELETE FROM payment_attempts`,
      sql`DELETE FROM order_items`,
      sql`DELETE FROM expenses`,
      sql`DELETE FROM shipments`,
      sql`DELETE FROM customer_addresses`,
      sql`DELETE FROM orders`,
      sql`DELETE FROM customers`,
      sql`DELETE FROM products`,
      sql`DELETE FROM expense_categories`,
      sql`DELETE FROM settings`,

      // ── Step 2: Insert in FK-safe order ─────────────────────────────

      // expense_categories (no FK)
      ...expense_categories.map(r => sql`
        INSERT INTO expense_categories (id, name, color, created_at, type, include_in_cost_price)
        VALUES (${r.id}, ${r.name}, ${r.color}, ${r.created_at}, ${r.type}, ${r.include_in_cost_price})
      `),

      // products (no FK)
      ...products.map(r => sql`
        INSERT INTO products (id, name, base_type, weight_grams, unit_price, is_active, is_seasonal, created_at, ingredients, slug, short_description, mini_label_description, image_url, in_stock, is_wholesale_eligible, is_featured, is_gift, category, price_range, display_order)
        VALUES (${r.id}, ${r.name}, ${r.base_type}, ${r.weight_grams}, ${r.unit_price}, ${r.is_active}, ${r.is_seasonal}, ${r.created_at}, ${r.ingredients ?? null}, ${r.slug ?? null}, ${r.short_description ?? null}, ${r.mini_label_description ?? null}, ${r.image_url ?? null}, ${r.in_stock ?? true}, ${r.is_wholesale_eligible ?? true}, ${r.is_featured ?? false}, ${r.is_gift ?? false}, ${r.category ?? null}, ${r.price_range ?? null}, ${r.display_order ?? null})
      `),

      // customers (no FK)
      ...customers.map(r => sql`
        INSERT INTO customers (id, name, phone, email, address, notes, created_at)
        VALUES (${r.id}, ${r.name}, ${r.phone}, ${r.email ?? null}, ${r.address ?? null}, ${r.notes ?? null}, ${r.created_at})
      `),

      // settings (no FK)
      ...settings.map(r => sql`
        INSERT INTO settings (key, value, description)
        VALUES (${r.key}, ${r.value}, ${r.description ?? null})
      `),

      // customer_addresses (FK: customers)
      ...customer_addresses.map(r => sql`
        INSERT INTO customer_addresses (id, customer_id, label, address_text, is_default, created_at)
        VALUES (${r.id}, ${r.customer_id}, ${r.label}, ${r.address_text}, ${r.is_default}, ${r.created_at})
      `),

      // orders (FK: customers)
      ...orders.map(r => sql`
        INSERT INTO orders (id, customer_id, order_date, order_value, shipping_charge, packaging_cost, material_cost, status, source, attribution, payment_provider, provider_order_id, provider_payment_id, checkout_session_id, checkout_fingerprint, payment_status, paid_at, payment_failed_at, payment_failure_reason, payment_failure_details, notes, created_at, dispatched_at, delivered_at)
        VALUES (${r.id}, ${r.customer_id}, ${r.order_date}, ${r.order_value}, ${r.shipping_charge}, ${r.packaging_cost}, ${r.material_cost ?? 0}, ${r.status}, ${r.source ?? null}, ${r.attribution ? JSON.stringify(r.attribution) : null}::jsonb, ${r.payment_provider ?? null}, ${r.provider_order_id ?? null}, ${r.provider_payment_id ?? null}, ${r.checkout_session_id ?? null}, ${r.checkout_fingerprint ?? null}, ${r.payment_status ?? 'unpaid'}, ${r.paid_at ?? null}, ${r.payment_failed_at ?? null}, ${r.payment_failure_reason ?? null}, ${r.payment_failure_details ? JSON.stringify(r.payment_failure_details) : null}::jsonb, ${r.notes ?? null}, ${r.created_at}, ${r.dispatched_at ?? null}, ${r.delivered_at ?? null})
      `),

      // payment_attempts (FK: orders)
      ...payment_attempts.map(r => sql`
        INSERT INTO payment_attempts (id, order_id, provider_order_id, provider_payment_id, status, method, error_code, error_description, error_source, error_step, error_reason, amount_paise, currency, provider_created_at, created_at, updated_at)
        VALUES (${r.id}, ${r.order_id}, ${r.provider_order_id}, ${r.provider_payment_id}, ${r.status}, ${r.method ?? null}, ${r.error_code ?? null}, ${r.error_description ?? null}, ${r.error_source ?? null}, ${r.error_step ?? null}, ${r.error_reason ?? null}, ${r.amount_paise ?? null}, ${r.currency ?? null}, ${r.provider_created_at ?? null}, ${r.created_at}, ${r.updated_at ?? r.created_at})
      `),

      // shipments (FK: orders)
      ...shipments.map(r => sql`
        INSERT INTO shipments (id, order_id, label, address_text, status, dispatched_at, delivered_at, created_at)
        VALUES (${r.id}, ${r.order_id}, ${r.label}, ${r.address_text}, ${r.status}, ${r.dispatched_at ?? null}, ${r.delivered_at ?? null}, ${r.created_at})
      `),

      // order_items (FK: orders, products, shipments)
      ...order_items.map(r => sql`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, created_at, shipment_id)
        VALUES (${r.id}, ${r.order_id}, ${r.product_id}, ${r.quantity}, ${r.unit_price}, ${r.created_at}, ${r.shipment_id ?? null})
      `),

      // expenses (FK: expense_categories)
      ...expenses.map(r => sql`
        INSERT INTO expenses (id, description, amount, expense_date, notes, created_at, category_id)
        VALUES (${r.id}, ${r.description}, ${r.amount}, ${r.expense_date}, ${r.notes ?? null}, ${r.created_at}, ${r.category_id ?? null})
      `),
    ];

    await sql.transaction(queries);

    return Response.json({
      success: true,
      restored: {
        expense_categories: expense_categories.length,
        products: products.length,
        customers: customers.length,
        settings: settings.length,
        customer_addresses: customer_addresses.length,
        orders: orders.length,
        payment_attempts: payment_attempts.length,
        shipments: shipments.length,
        order_items: order_items.length,
        expenses: expenses.length,
      },
    });
  } catch (error) {
    console.error('Import failed:', error);
    return Response.json({ error: 'Import failed: ' + error.message }, { status: 500 });
  }
}
