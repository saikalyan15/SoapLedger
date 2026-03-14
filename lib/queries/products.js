import sql from '../db';

export async function getProducts() {
  return await sql`
    SELECT * FROM products 
    ORDER BY is_active DESC, base_type ASC, name ASC
  `;
}

export async function addProduct(data) {
  const { 
    name, base_type, weight_grams, unit_price, is_seasonal, ingredients,
    slug, short_description, image_url, in_stock, is_featured, category, price_range
  } = data;

  return await sql`
    INSERT INTO products (
      name, base_type, weight_grams, unit_price, is_seasonal, ingredients, 
      slug, short_description, image_url, in_stock, is_featured, category, price_range,
      is_active
    )
    VALUES (
      ${name}, ${base_type}, ${weight_grams}, ${unit_price}, ${is_seasonal}, ${ingredients},
      ${slug}, ${short_description}, ${image_url}, ${in_stock}, ${is_featured}, ${category}, ${price_range},
      true
    )
    RETURNING *
  `;
}

export async function updateProduct(id, data) {
  const { 
    name, base_type, weight_grams, unit_price, is_seasonal, ingredients,
    slug, short_description, image_url, in_stock, is_featured, category, price_range
  } = data;

  return await sql`
    UPDATE products
    SET 
      name = ${name}, 
      base_type = ${base_type}, 
      weight_grams = ${weight_grams}, 
      unit_price = ${unit_price}, 
      is_seasonal = ${is_seasonal},
      ingredients = ${ingredients},
      slug = ${slug},
      short_description = ${short_description},
      image_url = ${image_url},
      in_stock = ${in_stock},
      is_featured = ${is_featured},
      category = ${category},
      price_range = ${price_range}
    WHERE id = ${id}
    RETURNING *
  `;
}

export async function toggleArchive(id) {
  return await sql`
    UPDATE products
    SET is_active = NOT is_active
    WHERE id = ${id}
    RETURNING *
  `;
}
