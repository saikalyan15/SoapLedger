import sql from '@/lib/db';

export async function getWholesalePricingProducts() {
  return await sql`
    SELECT
      id,
      name,
      base_type,
      weight_grams,
      unit_price,
      is_active,
      in_stock,
      price_range,
      display_order
    FROM products
    ORDER BY is_active DESC, base_type ASC, name ASC
  `;
}
