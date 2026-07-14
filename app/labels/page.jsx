import sql from '@/lib/db';
import CustomLabelsClient from './CustomLabelsClient';
import { getBusinessConfigAction } from '@/lib/actions/settings';

export default async function CustomLabelsPage() {
  const [products, businessConfig] = await Promise.all([
    sql`
      SELECT id, name, base_type, weight_grams, ingredients
      FROM products
      WHERE is_active = true
      ORDER BY base_type ASC, name ASC
    `,
    getBusinessConfigAction(),
  ]);

  return <CustomLabelsClient products={products} businessConfig={businessConfig} />;
}
