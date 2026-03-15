import sql from '../db';

export async function getProducts() {
  return await sql`
    SELECT p.*, 
      (SELECT count(*) FROM order_items oi WHERE oi.product_id = p.id)::int as order_count
    FROM products p
    ORDER BY p.is_active DESC, p.base_type ASC, p.name ASC
  `;
}

export async function deleteProduct(id) {
  return await sql`
    DELETE FROM products
    WHERE id = ${id} 
    AND id NOT IN (SELECT product_id FROM order_items)
    RETURNING *
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
    SET 
      is_active = NOT is_active,
      in_stock = CASE 
        WHEN is_active = true THEN false 
        ELSE in_stock 
      END
    WHERE id = ${id}
    RETURNING *
  `;
}

export async function updateProductSequence(updates) {
  // updates is an array of {id, display_order}
  // Using a JSON approach for bulk update in one query
  return await sql`
    UPDATE products as p
    SET display_order = u.display_order
    FROM (
      SELECT * FROM json_to_recordset(${JSON.stringify(updates)}) 
      AS x(id uuid, display_order int)
    ) as u
    WHERE p.id = u.id
    RETURNING p.*
  `;
}
