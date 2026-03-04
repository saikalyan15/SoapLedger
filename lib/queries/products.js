import sql from '../db';

export async function getProducts() {
  return await sql`
    SELECT * FROM products 
    ORDER BY is_active DESC, base_type ASC, name ASC
  `;
}

export async function addProduct({ name, base_type, weight_grams, unit_price, is_seasonal, ingredients }) {
  return await sql`
    INSERT INTO products (name, base_type, weight_grams, unit_price, is_seasonal, ingredients, is_active)
    VALUES (${name}, ${base_type}, ${weight_grams}, ${unit_price}, ${is_seasonal}, ${ingredients}, true)
    RETURNING *
  `;
}

export async function updateProduct(id, { name, base_type, weight_grams, unit_price, is_seasonal, ingredients }) {
  return await sql`
    UPDATE products
    SET 
      name = ${name}, 
      base_type = ${base_type}, 
      weight_grams = ${weight_grams}, 
      unit_price = ${unit_price}, 
      is_seasonal = ${is_seasonal},
      ingredients = ${ingredients}
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
