import sql from '@/lib/db';
import CustomLabelsClient from './CustomLabelsClient';

export default async function CustomLabelsPage() {
  const products = await sql`
    SELECT id, name, base_type, weight_grams, ingredients
    FROM products
    WHERE is_active = true
    ORDER BY base_type ASC, name ASC
  `;

  return <CustomLabelsClient products={products} />;
}
