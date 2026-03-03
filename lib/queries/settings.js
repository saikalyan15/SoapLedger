import sql from '../db';

export async function getSettings() {
  return await sql`SELECT * FROM settings ORDER BY key ASC`;
}

export async function updateSetting(key, value) {
  return await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE 
    SET value = EXCLUDED.value
    RETURNING *
  `;
}
