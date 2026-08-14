import { validateApiKey } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

function refFor(id) {
  return `HS-${id.slice(0, 8).toUpperCase()}`;
}

export async function POST(request) {
  if (!validateApiKey(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.checkout_session_id || '');
  const fingerprint = String(body.checkout_fingerprint || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
      || !/^[0-9a-f]{64}$/i.test(fingerprint)) {
    return NextResponse.json({ error: 'Invalid checkout session' }, { status: 400 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, status, payment_status, payment_provider, provider_order_id,
              provider_payment_id, checkout_session_id, checkout_fingerprint,
              order_value, shipping_charge
       FROM orders WHERE checkout_session_id = $1 LIMIT 1`,
      [sessionId]
    );
    const order = result.rows[0];
    if (!order) return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 });
    if (order.checkout_fingerprint !== fingerprint) {
      return NextResponse.json(
        { error: 'Checkout details changed. Start a new payment session.', code: 'CHECKOUT_CHANGED' },
        { status: 409 }
      );
    }
    return NextResponse.json({ ...order, order_id: order.id, ref: refFor(order.id), existing: true });
  } catch (error) {
    console.error('Checkout session lookup failed:', error);
    return NextResponse.json({ error: 'Could not look up checkout session' }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
