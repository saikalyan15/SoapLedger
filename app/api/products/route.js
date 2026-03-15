import sql from '@/lib/db';
import { validateApiKey, ALLOWED_ORIGINS } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
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

  try {
    const products = await sql`
      SELECT * FROM products 
      WHERE is_active = true OR in_stock = true
      ORDER BY display_order ASC, name ASC
    `;

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      base_type: p.base_type,
      price: p.unit_price,
      price_range: p.price_range || null,
      short_description: p.short_description || '',
      ingredients: p.ingredients ? p.ingredients.split(',').map(i => i.trim()) : [],
      image_url: p.image_url || '',
      in_stock: p.in_stock,
      is_featured: p.is_featured,
      category: p.category || p.base_type,
      display_order: p.display_order || 0,
    }));

    return NextResponse.json(formattedProducts, {
      headers: {
        ...(origin && { 'Access-Control-Allow-Origin': origin })
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
