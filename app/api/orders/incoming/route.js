import { validateApiKey, ALLOWED_ORIGINS } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { normaliseToE164 } from '@/lib/utils/phone';
import { revalidatePath } from 'next/cache';

export async function POST(request) {
  const origin = request.headers.get('origin');

  if (!validateApiKey(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create pool per-request so serverless instances never reuse stale connections
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { customer, items, shipping, source, attribution, notes: customNotes } = body;

    if (!customer || !customer.phone || !items || !items.length) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Find or Create Customer
    const custName = customer.name || 'Unknown';
    const custPhone = normaliseToE164(customer.phone);
    const custAddress = customer.address || 'No address provided';

    let customerId;
    const custResult = await client.query('SELECT id FROM customers WHERE phone = $1', [custPhone]);
    
    if (custResult.rows.length === 0) {
      const insertCust = await client.query(
        'INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING id',
        [custName, custPhone, custAddress]
      );
      customerId = insertCust.rows[0].id;
    } else {
      customerId = custResult.rows[0].id;
      await client.query(
        'UPDATE customers SET name = $1, address = $2 WHERE id = $3',
        [custName, custAddress, customerId]
      );
    }

    // 2. Ensure address record
    await client.query(
      'INSERT INTO customer_addresses (customer_id, label, address_text, is_default) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [customerId, 'Primary', custAddress, true]
    );

    // 3. Resolve Product IDs
    const resolvedItems = [];
    let totalValue = 0;

    for (const item of items) {
      let product;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product_id);
      
      if (isUuid) {
        const prodRes = await client.query('SELECT id, unit_price FROM products WHERE id = $1', [item.product_id]);
        product = prodRes.rows[0];
      } else {
        const prodRes = await client.query('SELECT id, unit_price FROM products WHERE slug = $1', [String(item.product_id)]);
        product = prodRes.rows[0];
      }

      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const itemQty = parseInt(item.qty) || 1;
      const itemPrice = parseFloat(item.price) || parseFloat(product.unit_price) || 0;

      resolvedItems.push({ id: product.id, qty: itemQty, price: itemPrice });
      totalValue += (itemPrice * itemQty);
    }

    // 4. Create Order
    const shipCharge = parseFloat(shipping) || 0;
    const finalRevenue = totalValue + shipCharge;
    const combinedNotes = customNotes || null;

    // Normalize source
    const normalizedSource = (source?.toLowerCase() === 'website order' || source?.toLowerCase() === 'website') ? 'Website' : source;
    const normalizedAttribution = attribution && typeof attribution === 'object'
      ? JSON.stringify(attribution)
      : null;

    const orderRes = await client.query(
      'INSERT INTO orders (customer_id, order_date, order_value, shipping_charge, status, source, notes, attribution) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7::jsonb) RETURNING id, status',
      [customerId, finalRevenue, shipCharge, 'Order Placed', normalizedSource || null, combinedNotes, normalizedAttribution]
    );
    const newOrder = orderRes.rows[0];

    // 5. Create Shipment
    const shipRes = await client.query(
      'INSERT INTO shipments (order_id, status, address_text, label) VALUES ($1, $2, $3, $4) RETURNING id',
      [newOrder.id, 'Order Placed', custAddress, custName]
    );
    const newShipment = shipRes.rows[0];

    // 6. Insert Items
    for (const item of resolvedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, shipment_id) VALUES ($1, $2, $3, $4, $5)',
        [newOrder.id, item.id, item.qty, item.price, newShipment.id]
      );
    }

    await client.query('COMMIT');

    revalidatePath('/orders');
    revalidatePath('/customers');
    revalidatePath('/dashboard');

    return NextResponse.json({ order_id: newOrder.id, status: newOrder.status }, {
      headers: { ...(origin && { 'Access-Control-Allow-Origin': origin }) }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating incoming order:', error);
    return NextResponse.json({ 
      error: 'Failed to create order', 
      message: error.message 
    }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}

export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
