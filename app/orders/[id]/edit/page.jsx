import { getOrderById, getOrderItems, getActiveProducts, getSettings, getShipmentsByOrderId } from '@/lib/queries/orders';
import OrderForm from '@/app/orders/new/OrderForm';
import Link from 'next/link';

export default async function EditOrderPage({ params }) {
  const { id } = await params;
  
  const [order, items, products, settings, shipments] = await Promise.all([
    getOrderById(id),
    getOrderItems(id),
    getActiveProducts(),
    getSettings(),
    getShipmentsByOrderId(id)
  ]);

  if (!order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', color: '#1B4332' }}>Order Not Found</h1>
        <Link href="/orders" style={{ color: '#1B4332', textDecoration: 'underline' }}>Back to Orders</Link>
      </div>
    );
  }

  const lockedStatuses = ['Dispatched', 'Delivered', 'Cancelled'];
  const isLocked = lockedStatuses.includes(order.status);

  if (isLocked) {
    // ... (rest of locked status UI)
  }

  return (
    <div style={{ padding: '40px' }}>
      <OrderForm 
        products={products} 
        settings={settings} 
        initialData={{ order, items, shipments }} 
      />
    </div>
  );
}
