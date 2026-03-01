import { getOrderById, getOrderItems } from '@/lib/queries/orders';
import OrderDetailsView from './OrderDetailsView';
import Link from 'next/link';

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  
  const [order, items] = await Promise.all([
    getOrderById(id),
    getOrderItems(id)
  ]);

  if (!order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Order Not Found</h1>
        <Link href="/orders" style={{ color: '#1B4332', textDecoration: 'underline' }}>Back to Orders</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <OrderDetailsView order={order} items={items} />
    </div>
  );
}
