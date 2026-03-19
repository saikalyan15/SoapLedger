import sql from '@/lib/db';

export async function GET() {
  try {
    const [
      expense_categories,
      products,
      customers,
      settings,
      customer_addresses,
      orders,
      shipments,
      order_items,
      expenses,
    ] = await Promise.all([
      sql`SELECT * FROM expense_categories ORDER BY created_at`,
      sql`SELECT * FROM products ORDER BY created_at`,
      sql`SELECT * FROM customers ORDER BY created_at`,
      sql`SELECT * FROM settings ORDER BY key`,
      sql`SELECT * FROM customer_addresses ORDER BY created_at`,
      sql`SELECT * FROM orders ORDER BY created_at`,
      sql`SELECT * FROM shipments ORDER BY created_at`,
      sql`SELECT * FROM order_items ORDER BY created_at`,
      sql`SELECT * FROM expenses ORDER BY created_at`,
    ]);

    const backup = {
      version: '1.0',
      app: 'SoapLedger',
      exported_at: new Date().toISOString(),
      counts: {
        expense_categories: expense_categories.length,
        products: products.length,
        customers: customers.length,
        settings: settings.length,
        customer_addresses: customer_addresses.length,
        orders: orders.length,
        shipments: shipments.length,
        order_items: order_items.length,
        expenses: expenses.length,
      },
      tables: {
        expense_categories,
        products,
        customers,
        settings,
        customer_addresses,
        orders,
        shipments,
        order_items,
        expenses,
      },
    };

    const filename = `soapledger-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return Response.json({ error: 'Export failed: ' + error.message }, { status: 500 });
  }
}
