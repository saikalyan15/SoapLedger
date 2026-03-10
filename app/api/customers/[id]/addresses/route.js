import { NextResponse } from 'next/server';
import { getAddressesByCustomerId } from '@/lib/queries/customers';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ addresses: [] });
  }

  try {
    const addresses = await getAddressesByCustomerId(id);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}
