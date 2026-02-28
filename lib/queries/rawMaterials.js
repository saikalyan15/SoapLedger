import sql from '../db';

export async function getRawMaterials() {
  return await sql`
    SELECT *, (quantity * unit_cost) as total_cost 
    FROM raw_materials 
    ORDER BY procured_on DESC, created_at DESC
  `;
}

export async function addRawMaterial({ name, category, quantity, unit, unit_cost, procured_on, notes }) {
  return await sql`
    INSERT INTO raw_materials (name, category, quantity, unit, unit_cost, procured_on, notes)
    VALUES (${name}, ${category}, ${quantity}, ${unit}, ${unit_cost}, ${procured_on}, ${notes})
    RETURNING *
  `;
}

export async function deleteRawMaterial(id) {
  return await sql`
    DELETE FROM raw_materials
    WHERE id = ${id}
    RETURNING *
  `;
}
