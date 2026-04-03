import { getOrdersBySource } from '@/lib/queries/orders';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const orders = await getOrdersBySource(60);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Order Source API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
