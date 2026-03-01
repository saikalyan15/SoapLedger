import { NextResponse } from 'next/server';
import { getCustomerOrderHistory } from '@/lib/queries/orders';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    const orders = await getCustomerOrderHistory(id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching customer order history:', error);
    return NextResponse.json({ error: 'Failed to fetch customer order history' }, { status: 500 });
  }
}
