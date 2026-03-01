import OrderForm from './OrderForm';
import { getActiveProducts, getSettings } from '@/lib/queries/orders';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const [products, settings] = await Promise.all([
    getActiveProducts(),
    getSettings()
  ]);

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[680px]">
        <OrderForm products={products} settings={settings} />
      </div>
    </div>
  );
}
