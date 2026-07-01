import sql from '../db';

export async function getProducts() {
  return await sql`
    SELECT p.*,
      (SELECT count(*) FROM order_items oi WHERE oi.product_id = p.id)::int as order_count,
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'id', peo.essential_oil_id,
            'name', eo.name,
            'is_default', peo.is_default
          ) ORDER BY eo.name)
          FROM product_essential_oils peo
          JOIN essential_oils eo ON eo.id = peo.essential_oil_id
          WHERE peo.product_id = p.id
        ),
        '[]'::json
      ) AS linked_oils
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
    slug, short_description, image_url, in_stock, is_wholesale_eligible, is_featured, is_gift, category, price_range, notes, texture
  } = data;

  // Auto-assign display_order as MAX + 1 so new products appear last
  const [{ next_order }] = await sql`SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM products`;

  return await sql`
    INSERT INTO products (
      name, base_type, weight_grams, unit_price, is_seasonal, ingredients,
      slug, short_description, image_url, in_stock, is_wholesale_eligible, is_featured, is_gift, category, price_range,
      display_order, is_active, notes, texture
    )
    VALUES (
      ${name}, ${base_type}, ${weight_grams}, ${unit_price}, ${is_seasonal}, ${ingredients},
      ${slug}, ${short_description}, ${image_url}, ${in_stock}, ${is_wholesale_eligible}, ${is_featured}, ${is_gift}, ${category}, ${price_range},
      ${next_order}, true, ${notes}, ${texture}
    )
    RETURNING *
  `;
}

export async function updateProduct(id, data) {
  const {
    name, base_type, weight_grams, unit_price, is_seasonal, ingredients,
    slug, short_description, image_url, in_stock, is_wholesale_eligible, is_featured, is_gift, category, price_range, notes, texture
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
      is_wholesale_eligible = ${is_wholesale_eligible},
      is_featured = ${is_featured},
      is_gift = ${is_gift},
      category = ${category},
      price_range = ${price_range},
      notes = ${notes},
      texture = ${texture}
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

export async function updateFeaturedProducts(updates) {
  // updates is an array of {id, is_featured, featured_order}
  return await sql`
    UPDATE products as p
    SET
      is_featured = u.is_featured,
      featured_order = u.featured_order
    FROM (
      SELECT * FROM json_to_recordset(${JSON.stringify(updates)})
      AS x(id uuid, is_featured boolean, featured_order int)
    ) as u
    WHERE p.id = u.id
    RETURNING p.*
  `;
}
