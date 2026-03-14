import sql from '@/lib/db';
import { validateApiKey, ALLOWED_ORIGINS } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Upstash Redis & Ratelimit
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
});

export async function POST(request) {
  // 1. CORS check
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. API Key validation
  if (!validateApiKey(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        ...(origin && { 'Access-Control-Allow-Origin': origin })
      },
    });
  }

  // 3. Rate limiting (using IP or a unique identifier)
  // Next.js provides the IP in the request headers (x-forwarded-for)
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        ...(origin && { 'Access-Control-Allow-Origin': origin })
      },
    });
  }

  try {
    const body = await request.json();
    const { customer, items, shipping, source } = body;

    if (!customer || !customer.phone || !customer.name || !items || !items.length) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    // Logic: check if customer exists by phone number
    let [dbCustomer] = await sql`SELECT id FROM customers WHERE phone = ${customer.phone}`;
    let customerId;

    if (!dbCustomer) {
      // Create new customer
      const [newCustomer] = await sql`
        INSERT INTO customers (name, phone, address)
        VALUES (${customer.name}, ${customer.phone}, ${customer.address})
        RETURNING id
      `;
      customerId = newCustomer.id;
    } else {
      customerId = dbCustomer.id;
      // Update address if it changed? The user didn't specify, 
      // but it's good practice. I'll skip it unless it's needed.
    }

    // Ensure customer has a saved address record (per migration v3)
    await sql`
      INSERT INTO customer_addresses (customer_id, label, address_text, is_default)
      VALUES (${customerId}, 'Primary', ${customer.address}, TRUE)
      ON CONFLICT DO NOTHING
    `;

    // Create a new order with status 'Order Placed'
    const [newOrder] = await sql`
      INSERT INTO orders (
        customer_id, 
        order_date, 
        order_value, 
        shipping_charge, 
        status, 
        notes
      ) VALUES (
        ${customerId}, 
        CURRENT_DATE, 
        ${items.reduce((sum, item) => sum + (item.price * item.qty), 0)}, 
        ${shipping || 0}, 
        'Order Placed',
        ${source ? `Source: ${source}` : ''}
      )
      RETURNING id, status
    `;

    // Create a shipment (per migration v3)
    const [newShipment] = await sql`
      INSERT INTO shipments (order_id, status, address_text, label)
      VALUES (${newOrder.id}, 'Order Placed', ${customer.address}, 'Website Order')
      RETURNING id
    `;

    // Insert line items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, shipment_id
        ) VALUES (
          ${newOrder.id}, ${item.product_id}, ${item.qty}, ${item.price}, ${newShipment.id}
        )
      `;
    }

    return NextResponse.json({
      order_id: newOrder.id,
      customer_id: customerId,
      status: newOrder.status
    }, {
      headers: {
        ...(origin && { 'Access-Control-Allow-Origin': origin })
      }
    });

  } catch (error) {
    console.error('Error creating incoming order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Handle OPTIONS for preflight
export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
