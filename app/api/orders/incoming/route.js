import { validateApiKey } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { normaliseToE164 } from '@/lib/utils/phone';
import { revalidatePath } from 'next/cache';

function refFor(id) {
  return `HS-${id.slice(0, 8).toUpperCase()}`;
}

async function findExistingCheckout(client, { checkoutSessionId, providerOrderId }) {
  if (!checkoutSessionId && !providerOrderId) return null;
  const result = await client.query(
    `SELECT id, status, payment_status, payment_provider, provider_order_id,
            provider_payment_id, checkout_session_id, checkout_fingerprint,
            order_value, shipping_charge
     FROM orders
     WHERE ($1::uuid IS NOT NULL AND checkout_session_id = $1)
        OR ($2::text IS NOT NULL AND provider_order_id = $2)
     ORDER BY checkout_session_id = $1 DESC
     LIMIT 1`,
    [checkoutSessionId, providerOrderId]
  );
  const order = result.rows[0];
  return order ? { ...order, order_id: order.id, ref: refFor(order.id), existing: true } : null;
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  let requestBody = null;

  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const body = await request.json();
    requestBody = body;
    const { customer, items, shipping, source, attribution, notes: customNotes, payment, intent, consent } = body;
    const isInterest = intent === 'interest';

    if (!customer?.phone || !Array.isArray(items) || items.length === 0 || (isInterest && (!customer.email || consent !== true))) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    const providerOrderId = payment?.provider_order_id || null;
    const checkoutSessionId = payment?.checkout_session_id || null;
    const checkoutFingerprint = payment?.checkout_fingerprint || null;
    if (payment?.provider === 'razorpay' && (
      !/^order_[A-Za-z0-9]+$/.test(providerOrderId || '')
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutSessionId || '')
      || !/^[0-9a-f]{64}$/i.test(checkoutFingerprint || '')
    )) {
      return NextResponse.json({ error: 'Invalid payment session' }, { status: 400 });
    }

    const existingCheckout = await findExistingCheckout(client, { checkoutSessionId, providerOrderId });
    if (existingCheckout) {
      if (checkoutSessionId && existingCheckout.checkout_session_id === checkoutSessionId
          && existingCheckout.checkout_fingerprint !== checkoutFingerprint) {
        return NextResponse.json(
          { error: 'Checkout details changed. Start a new payment session.', code: 'CHECKOUT_CHANGED' },
          { status: 409 }
        );
      }
      return NextResponse.json(existingCheckout);
    }

    const availability = await client.query(
      "SELECT COALESCE((SELECT value FROM settings WHERE key = 'accepting_orders'), 'true') AS value"
    );
    if (availability.rows[0]?.value !== 'true' && !isInterest) {
      return NextResponse.json(
        { error: 'Orders are temporarily paused while we catch up.', code: 'ORDERS_PAUSED' },
        { status: 503 }
      );
    }

    await client.query('BEGIN');

    // Serialize concurrent submissions for the same logical checkout. Both
    // requests may already have created a provider-side order, but only one is
    // allowed to become the SoapLedger order returned to Checkout.
    if (checkoutSessionId) {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [checkoutSessionId]);
      const racedCheckout = await findExistingCheckout(client, { checkoutSessionId, providerOrderId: null });
      if (racedCheckout) {
        if (racedCheckout.checkout_fingerprint !== checkoutFingerprint) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Checkout details changed. Start a new payment session.', code: 'CHECKOUT_CHANGED' },
            { status: 409 }
          );
        }
        await client.query('COMMIT');
        return NextResponse.json(racedCheckout);
      }
    }

    const custName = customer.name || 'Unknown';
    const custPhone = normaliseToE164(customer.phone);
    const custAddress = customer.address || 'No address provided';
    const custEmail = customer.email ? String(customer.email).trim().toLowerCase() : null;

    let customerId;
    const custResult = await client.query(
      'SELECT id FROM customers WHERE phone = $1 OR ($2::text IS NOT NULL AND LOWER(email) = $2) LIMIT 1',
      [custPhone, custEmail]
    );
    if (custResult.rows.length === 0) {
      const insertCust = await client.query(
        'INSERT INTO customers (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING id',
        [custName, custPhone, custEmail, custAddress]
      );
      customerId = insertCust.rows[0].id;
    } else {
      customerId = custResult.rows[0].id;
      await client.query(
        'UPDATE customers SET name = $1, address = $2, email = COALESCE($3, email) WHERE id = $4',
        [custName, custAddress, custEmail, customerId]
      );
    }

    if (isInterest) {
      const existingInterest = await client.query(
        "SELECT id, status, payment_status FROM orders WHERE customer_id = $1 AND status = 'Awaiting Payment' AND source = 'Expression of Interest' ORDER BY created_at DESC LIMIT 1",
        [customerId]
      );
      if (existingInterest.rows[0]) {
        await client.query('COMMIT');
        const order = existingInterest.rows[0];
        return NextResponse.json({ ...order, order_id: order.id, ref: refFor(order.id), existing: true });
      }
    }

    await client.query(
      'INSERT INTO customer_addresses (customer_id, label, address_text, is_default) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [customerId, 'Primary', custAddress, true]
    );

    const resolvedItems = [];
    let totalValue = 0;
    for (const item of items) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product_id);
      const prodRes = isUuid
        ? await client.query('SELECT id, unit_price FROM products WHERE id = $1', [item.product_id])
        : await client.query('SELECT id, unit_price FROM products WHERE slug = $1', [String(item.product_id)]);
      const product = prodRes.rows[0];
      if (!product) throw new Error(`Product not found: ${item.product_id}`);

      const itemQty = Math.max(1, parseInt(item.qty, 10) || 1);
      const itemPrice = parseFloat(product.unit_price) || 0;
      resolvedItems.push({ id: product.id, qty: itemQty, price: itemPrice });
      totalValue += itemPrice * itemQty;
    }

    const shipCharge = parseFloat(shipping) || 0;
    const finalRevenue = totalValue + shipCharge;
    const normalizedSource = isInterest
      ? 'Expression of Interest'
      : (['website order', 'website'].includes(source?.toLowerCase()) ? 'Website' : source);
    const normalizedAttribution = attribution && typeof attribution === 'object' ? JSON.stringify(attribution) : null;
    const isPendingPayment = payment?.provider === 'razorpay' && providerOrderId;
    const status = (isInterest || isPendingPayment) ? 'Awaiting Payment' : 'Order Placed';
    const paymentStatus = isPendingPayment ? 'pending' : 'unpaid';
    const orderNotes = isInterest
      ? [customNotes, `Order-reopen email consent recorded at ${new Date().toISOString()}`].filter(Boolean).join(' | ')
      : (customNotes || null);

    const orderRes = await client.query(
      `INSERT INTO orders (
        customer_id, order_date, order_value, shipping_charge, status, source,
        notes, attribution, payment_provider, provider_order_id, payment_status,
        checkout_session_id, checkout_fingerprint
      ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)
      RETURNING id, status, payment_status, payment_provider, provider_order_id,
                provider_payment_id, checkout_session_id, checkout_fingerprint,
                order_value, shipping_charge`,
      [customerId, finalRevenue, shipCharge, status, normalizedSource || null, orderNotes,
        normalizedAttribution, payment?.provider || null, providerOrderId, paymentStatus,
        checkoutSessionId, checkoutFingerprint]
    );
    const newOrder = orderRes.rows[0];

    const shipRes = await client.query(
      'INSERT INTO shipments (order_id, status, address_text, label) VALUES ($1, $2, $3, $4) RETURNING id',
      [newOrder.id, status, custAddress, custName]
    );

    for (const item of resolvedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, shipment_id) VALUES ($1, $2, $3, $4, $5)',
        [newOrder.id, item.id, item.qty, item.price, shipRes.rows[0].id]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/orders');
    revalidatePath('/customers');
    revalidatePath('/dashboard');

    return NextResponse.json({
      order_id: newOrder.id,
      ref: refFor(newOrder.id),
      status: newOrder.status,
      payment_status: newOrder.payment_status,
      payment_provider: newOrder.payment_provider,
      provider_order_id: newOrder.provider_order_id,
      provider_payment_id: newOrder.provider_payment_id,
      checkout_session_id: newOrder.checkout_session_id,
      checkout_fingerprint: newOrder.checkout_fingerprint,
      order_value: newOrder.order_value,
      shipping_charge: newOrder.shipping_charge,
    }, { headers: { ...(origin && { 'Access-Control-Allow-Origin': origin }) } });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    if (error?.code === '23505' && [
      'orders_provider_order_id_unique',
      'orders_checkout_session_id_unique',
    ].includes(error?.constraint)) {
      const existing = await findExistingCheckout(client, {
        checkoutSessionId: requestBody?.payment?.checkout_session_id || null,
        providerOrderId: requestBody?.payment?.provider_order_id || null,
      });
      if (existing) return NextResponse.json(existing);
      return NextResponse.json({ error: 'Order already exists; retry the request.' }, { status: 409 });
    }
    console.error('Error creating incoming order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
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
