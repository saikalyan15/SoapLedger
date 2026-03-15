import { getAllOrders } from '@/lib/queries/orders';
import OrdersView from './OrdersView';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await getAllOrders();

  return (
    <div style={{ padding: '40px' }}>
      <OrdersView orders={orders} />
    </div>
  );
}
