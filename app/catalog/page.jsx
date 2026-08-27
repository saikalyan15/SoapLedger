import sql from '@/lib/db';
import CatalogClient from './CatalogClient';
import { getBusinessConfigAction } from '@/lib/actions/settings';
import { CATALOG_PRODUCTS, parseScents } from '@/lib/catalog/catalog-content';

export const dynamic = 'force-dynamic';

// Order the base-type sections the same way the collection is laid out.
const BASE_ORDER = ['Glycerine', 'Goat Milk', 'Papaya Cucumber', 'Shea Butter'];

export default async function CatalogPage() {
  const [rows, businessConfig] = await Promise.all([
    sql`
      SELECT slug, name, base_type, notes, display_order
      FROM products
      WHERE is_active = true
      ORDER BY display_order ASC NULLS LAST, name ASC
    `,
    getBusinessConfigAction(),
  ]);

  // A product is in the catalogue only if it has curated copy in
  // catalog-content.js — that allowlist is what keeps the curated boxes,
  // the Valentine's soap and the kids' toy collection out.
  const products = rows
    .filter((p) => p.slug && CATALOG_PRODUCTS[p.slug])
    .map((p) => {
      const entry = CATALOG_PRODUCTS[p.slug];
      return {
        slug: p.slug,
        baseType: p.base_type,
        image: entry.image,
        price: entry.price ?? null,
        order: entry.order ?? p.display_order ?? 999,
        scents: parseScents(p.notes),
        content: entry.content,
      };
    })
    .sort((a, b) => a.order - b.order);

  // Group into base-type sections, preserving product order within each.
  const sections = [];
  for (const product of products) {
    const key = product.baseType;
    let section = sections.find((s) => s.key === key);
    if (!section) {
      section = { key, products: [] };
      sections.push(section);
    }
    section.products.push(product);
  }
  sections.sort(
    (a, b) =>
      (BASE_ORDER.indexOf(a.key) + 1 || 99) - (BASE_ORDER.indexOf(b.key) + 1 || 99),
  );

  return <CatalogClient sections={sections} brand={businessConfig.brand} />;
}
