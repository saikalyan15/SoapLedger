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
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
});

export async function POST(request) {
  const origin = request.headers.get('origin');
  
  if (!validateApiKey(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { customer, items, shipping, source } = body;

    if (!customer || !customer.phone || !items || !items.length) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    // Process everything in a single transaction for data integrity
    const result = await sql.transaction(async (tx) => {
      
      // 1. Find or Create Customer
      let [dbCustomer] = await tx`SELECT id FROM customers WHERE phone = ${customer.phone}`;
      let customerId;

      if (!dbCustomer) {
        const [newCustomer] = await tx`
          INSERT INTO customers (name, phone, address)
          VALUES (${customer.name}, ${customer.phone}, ${customer.address})
          RETURNING id
        `;
        customerId = newCustomer.id;
      } else {
        customerId = dbCustomer.id;
        // Update customer name/address if provided
        await tx`
          UPDATE customers 
          SET name = ${customer.name}, address = ${customer.address} 
          WHERE id = ${customerId}
        `;
      }

      // 2. Ensure address record
      await tx`
        INSERT INTO customer_addresses (customer_id, label, address_text, is_default)
        VALUES (${customerId}, 'Primary', ${customer.address}, TRUE)
        ON CONFLICT DO NOTHING
      `;

      // 3. Resolve Product IDs
      // The website might send slugs or IDs. We'll try to find the product.
      const resolvedItems = [];
      let totalValue = 0;

      for (const item of items) {
        // Try finding by UUID first, then by slug
        let product;
        
        // Basic check if it's a UUID format
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product_id);
        
        if (isUuid) {
          [product] = await tx`SELECT id, unit_price FROM products WHERE id = ${item.product_id}`;
        } else {
          // If not UUID, treat it as a slug
          [product] = await tx`SELECT id, unit_price FROM products WHERE slug = ${String(item.product_id)}`;
        }

        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        resolvedItems.push({
          id: product.id,
          qty: item.qty,
          price: item.price || product.unit_price
        });
        
        totalValue += (item.price || product.unit_price) * item.qty;
      }

      // 4. Create Order
      const [newOrder] = await tx`
        INSERT INTO orders (
          customer_id, order_date, order_value, 
          shipping_charge, status, notes
        ) VALUES (
          ${customerId}, CURRENT_DATE, ${totalValue}, 
          ${shipping || 0}, 'Order Placed', ${source ? `Source: ${source}` : ''}
        )
        RETURNING id, status
      `;

      // 5. Create Shipment
      const [newShipment] = await tx`
        INSERT INTO shipments (order_id, status, address_text, label)
        VALUES (${newOrder.id}, 'Order Placed', ${customer.address}, 'Website Order')
        RETURNING id
      `;

      // 6. Insert Items
      for (const item of resolvedItems) {
        await tx`
          INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, shipment_id
          ) VALUES (
            ${newOrder.id}, ${item.id}, ${item.qty}, ${item.price}, ${newShipment.id}
          )
        `;
      }

      return { order_id: newOrder.id, status: newOrder.status };
    });

    return NextResponse.json(result, {
      headers: { ...(origin && { 'Access-Control-Allow-Origin': origin }) }
    });

  } catch (error) {
    console.error('Error creating incoming order:', error);
    return NextResponse.json({ 
      error: 'Failed to create order', 
      message: error.message 
    }, { status: 500 });
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
