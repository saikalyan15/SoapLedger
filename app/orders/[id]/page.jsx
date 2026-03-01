import { getOrderById } from '@/lib/queries/orders';
import OrderDetailsView from './OrderDetailsView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }) {
  const { id } = await params;
  const order = await getOrderById(id);
  
  if (!order || !order.id) {
    notFound();
  }
  
  return <OrderDetailsView order={order} />;
}
