import { getOrderById, getOrderItems, getActiveProducts, getSettings } from '@/lib/queries/orders';
import OrderForm from '@/app/orders/new/OrderForm';
import Link from 'next/link';

export default async function EditOrderPage({ params }) {
  const { id } = await params;
  
  const [order, items, products, settings] = await Promise.all([
    getOrderById(id),
    getOrderItems(id),
    getActiveProducts(),
    getSettings()
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
    return (
      <div style={{ padding: '40px', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ 
          background: '#F9FAFB', 
          border: '1px solid #E5E7EB', 
          borderRadius: '16px', 
          padding: '48px 24px' 
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#FEE2E2', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: '#111827', margin: '0 0 12px 0' }}>
            Order Locked
          </h1>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '16px', color: '#6B7280', margin: '0 0 32px 0' }}>
            This order is marked as <strong>{order.status}</strong> and can no longer be edited.
          </p>
          <Link 
            href={`/orders/${id}`}
            style={{ 
              display: 'inline-block',
              background: '#1B4332',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            View Order Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <OrderForm 
        products={products} 
        settings={settings} 
        initialData={{ order, items }} 
      />
    </div>
  );
}
