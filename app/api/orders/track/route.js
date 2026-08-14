import { validateApiKey } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { normaliseToE164 } from '@/lib/utils/phone';

const REF_PATTERN = /^HS-([0-9A-F]{8})$/i;

export async function POST(request) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const refMatch = String(body.ref || '').trim().match(REF_PATTERN);
  const phone = normaliseToE164(body.phone || '');
  if (!refMatch || !/^\+91[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const orderResult = await client.query(
      `SELECT o.id, o.order_date, o.created_at, o.status, o.source,
              o.payment_status, o.payment_provider, o.paid_at, o.payment_failed_at,
              o.order_value, o.shipping_charge
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE LEFT(o.id::text, 8) = $1 AND c.phone = $2
       LIMIT 1`,
      [refMatch[1].toLowerCase(), phone]
    );
    const order = orderResult.rows[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const [itemsResult, shipmentsResult] = await Promise.all([
      client.query(
        `SELECT p.name, oi.quantity
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1
         ORDER BY oi.created_at ASC`,
        [order.id]
      ),
      client.query(
        `SELECT status, dispatched_at, delivered_at
         FROM shipments
         WHERE order_id = $1
         ORDER BY created_at ASC`,
        [order.id]
      ),
    ]);

    return NextResponse.json({
      ref: `HS-${order.id.slice(0, 8).toUpperCase()}`,
      status: order.status,
      payment_provider: order.payment_provider,
      payment_status: order.payment_provider === 'razorpay'
        ? order.payment_status
        : ['Payment Confirmed', 'In Manufacturing', 'Ready to Dispatch', 'Dispatched', 'Partially Dispatched', 'Partially Delivered', 'Delivered'].includes(order.status)
          ? 'paid'
          : 'pending',
      is_interest: order.source === 'Expression of Interest',
      order_date: order.order_date,
      created_at: order.created_at,
      paid_at: order.paid_at,
      payment_failed_at: order.payment_failed_at,
      total: Number(order.order_value),
      shipping: Number(order.shipping_charge),
      items: itemsResult.rows.map((item) => ({
        name: item.name,
        quantity: Number(item.quantity),
      })),
      shipments: shipmentsResult.rows,
    }, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch (error) {
    console.error('Order tracking lookup failed:', error);
    return NextResponse.json({ error: 'Could not check order status' }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
