import sql from '../db';

export async function getAllEssentialOils() {
  return await sql`
    SELECT * FROM essential_oils
    ORDER BY name ASC
  `;
}

export async function createEssentialOil({ name, notes, quantity_ml }) {
  return await sql`
    INSERT INTO essential_oils (name, notes, quantity_ml)
    VALUES (${name}, ${notes || null}, ${quantity_ml || null})
    RETURNING *
  `;
}

export async function updateEssentialOil(id, { name, notes, quantity_ml }) {
  return await sql`
    UPDATE essential_oils
    SET name = ${name}, notes = ${notes || null}, quantity_ml = ${quantity_ml || null}
    WHERE id = ${id}
    RETURNING *
  `;
}

export async function deleteEssentialOil(id) {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM product_essential_oils
    WHERE essential_oil_id = ${id}
  `;
  if (count > 0) {
    throw new Error('Remove this oil from all products before deleting');
  }
  return await sql`
    DELETE FROM essential_oils WHERE id = ${id} RETURNING *
  `;
}

export async function getOilsForProduct(productId) {
  return await sql`
    SELECT eo.id, eo.name, eo.notes, eo.quantity_ml, peo.is_default
    FROM product_essential_oils peo
    JOIN essential_oils eo ON eo.id = peo.essential_oil_id
    WHERE peo.product_id = ${productId}
    ORDER BY eo.name ASC
  `;
}

export async function setOilsForProduct(productId, oils) {
  // oils = [{ essential_oil_id: uuid, is_default: bool }, ...]
  await sql`
    DELETE FROM product_essential_oils WHERE product_id = ${productId}
  `;
  if (!oils || oils.length === 0) return [];
  return await sql`
    INSERT INTO product_essential_oils (product_id, essential_oil_id, is_default)
    SELECT ${productId}, x.essential_oil_id, x.is_default
    FROM json_to_recordset(${JSON.stringify(oils)})
      AS x(essential_oil_id uuid, is_default boolean)
  `;
}

export async function getEssentialOilsForOrder(orderId) {
  return await sql`
    SELECT
      p.id          AS product_id,
      p.name        AS product_name,
      oi.quantity   AS soap_qty,
      eo.id         AS oil_id,
      eo.name       AS oil_name,
      eo.notes      AS oil_notes,
      oi.quantity   AS units_needed
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    LEFT JOIN product_essential_oils peo
      ON peo.product_id = p.id AND peo.is_default = TRUE
    LEFT JOIN essential_oils eo
      ON eo.id = peo.essential_oil_id
    WHERE oi.order_id = ${orderId}
    ORDER BY p.name ASC
  `;
}
