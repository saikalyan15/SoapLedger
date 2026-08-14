import { validateApiKey } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';

function refFor(id) {
  return `HS-${id.slice(0, 8).toUpperCase()}`;
}

function sanitiseFailureDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const limits = {
    payment_id: 100,
    method: 50,
    code: 100,
    source: 100,
    step: 100,
    reason: 100,
  };
  const details = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof value[key] === 'string' && value[key].trim()) {
      details[key] = value[key].trim().slice(0, limit);
    }
  }
  if (details.payment_id && !/^pay_[A-Za-z0-9]+$/.test(details.payment_id)) {
    delete details.payment_id;
  }
  return Object.keys(details).length > 0 ? details : null;
}

async function hydrateOrder(client, providerOrderId) {
  const orderRes = await client.query(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
     FROM orders o JOIN customers c ON c.id = o.customer_id
     WHERE o.provider_order_id = $1`,
    [providerOrderId]
  );
  const order = orderRes.rows[0];
  if (!order) return null;

  const itemRes = await client.query(
    `SELECT oi.product_id, oi.quantity AS qty, oi.unit_price AS price, p.slug AS product_slug, p.name AS product_name
     FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
    [order.id]
  );
  return { ...order, ref: refFor(order.id), items: itemRes.rows };
}

export async function POST(request) {
  if (!validateApiKey(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const { action, provider_order_id, provider_payment_id, failure_reason, failure_details } = await request.json();
    if (!provider_order_id || !['confirm', 'failed', 'manual', 'status'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payment update' }, { status: 400 });
    }

    await client.query('BEGIN');
    const locked = await client.query(
      'SELECT id, payment_status FROM orders WHERE provider_order_id = $1 FOR UPDATE',
      [provider_order_id]
    );
    if (!locked.rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let transitioned = false;
    if (action === 'confirm' && locked.rows[0].payment_status !== 'paid') {
      if (!provider_payment_id) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }
      await client.query(
        `UPDATE orders SET status = 'Payment Confirmed', payment_provider = 'razorpay', payment_status = 'paid',
         provider_payment_id = $1, paid_at = COALESCE(paid_at, NOW()) WHERE id = $2`,
        [provider_payment_id, locked.rows[0].id]
      );
      await client.query("UPDATE shipments SET status = 'Payment Confirmed' WHERE order_id = $1", [locked.rows[0].id]);
      transitioned = true;
    } else if (action === 'failed' && ['pending', 'failed'].includes(locked.rows[0].payment_status)) {
      const safeFailureDetails = sanitiseFailureDetails(failure_details);
      await client.query(
        `UPDATE orders SET payment_status = 'failed', payment_failed_at = NOW(),
         payment_failure_reason = $1,
         payment_failure_details = COALESCE($2::jsonb, payment_failure_details)
         WHERE id = $3`,
        [
          String(failure_reason || 'Payment was not completed').slice(0, 500),
          safeFailureDetails ? JSON.stringify(safeFailureDetails) : null,
          locked.rows[0].id,
        ]
      );
      transitioned = locked.rows[0].payment_status !== 'failed';
    } else if (action === 'manual' && ['pending', 'failed'].includes(locked.rows[0].payment_status)) {
      await client.query(
        "UPDATE orders SET status = 'Order Placed', payment_provider = 'manual', payment_status = 'unpaid' WHERE id = $1",
        [locked.rows[0].id]
      );
      await client.query("UPDATE shipments SET status = 'Order Placed' WHERE order_id = $1", [locked.rows[0].id]);
      transitioned = true;
    }

    await client.query('COMMIT');
    const order = await hydrateOrder(client, provider_order_id);
    revalidatePath('/orders');
    revalidatePath('/dashboard');
    return NextResponse.json({ transitioned, order });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Payment update failed:', error);
    return NextResponse.json({ error: 'Payment update failed' }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
