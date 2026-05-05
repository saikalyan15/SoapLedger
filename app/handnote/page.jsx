import sql from '@/lib/db';
import HandnoteClient from './HandnoteClient';

export default async function HandnotePage() {
  const products = await sql`
    SELECT id, name, base_type, ingredients, short_description
    FROM products
    WHERE is_active = true
    ORDER BY display_order ASC, name ASC
  `;

  return <HandnoteClient products={products} />;
}
