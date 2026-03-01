import { searchCustomersByName } from '@/lib/queries/customers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name || name.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const customers = await searchCustomersByName(name);
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
