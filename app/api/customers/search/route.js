import { NextResponse } from 'next/server';
import { searchCustomersByName } from '@/lib/queries/customers';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name || name.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  try {
    const customers = await searchCustomersByName(name);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 });
  }
}
