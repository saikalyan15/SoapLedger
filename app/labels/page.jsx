import sql from '@/lib/db';
import CustomLabelsClient from './CustomLabelsClient';
import { getBusinessConfigAction } from '@/lib/actions/settings';

export default async function CustomLabelsPage() {
  const [products, businessConfig] = await Promise.all([
    sql`
      SELECT
        p.id, p.name, p.base_type, p.weight_grams, p.ingredients,
        COALESCE(SUM(oi.quantity), 0)::int AS units_sold
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'Cancelled'
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.base_type, p.weight_grams, p.ingredients
      ORDER BY p.base_type ASC, p.name ASC
    `,
    getBusinessConfigAction(),
  ]);

  return <CustomLabelsClient products={products} businessConfig={businessConfig} />;
}
