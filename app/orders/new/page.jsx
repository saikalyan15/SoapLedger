import { getActiveProducts, getSettings } from '@/lib/queries/orders';
import OrderForm from './OrderForm';

export default async function NewOrderPage() {
  const [products, settings] = await Promise.all([
    getActiveProducts(),
    getSettings()
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <OrderForm products={products} settings={settings} />
    </div>
  );
}
