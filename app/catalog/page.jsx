import sql from '@/lib/db';
import CatalogClient from './CatalogClient';
import { getBusinessConfigAction } from '@/lib/actions/settings';
import { CATALOG_PRODUCTS } from '@/lib/catalog/catalog-content';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const [rows, businessConfig] = await Promise.all([
    sql`
      SELECT slug, name, is_active
      FROM products
      WHERE is_active = true
    `,
    getBusinessConfigAction(),
  ]);

  const active = new Set(rows.filter((r) => r.is_active && r.slug).map((r) => r.slug));

  // A product is in the catalogue only if it has curated copy in
  // catalog-content.js. That allowlist is the scope of the catalogue.
  const products = Object.entries(CATALOG_PRODUCTS)
    .filter(([slug]) => active.has(slug))
    .map(([slug, entry]) => ({
      slug,
      image: entry.image,
      price: entry.price ?? null,
      order: entry.order ?? 999,
      content: entry.content,
    }))
    .sort((a, b) => a.order - b.order);

  return <CatalogClient products={products} brand={businessConfig.brand} />;
}
