import sql from '../db';

export async function getSettings() {
  return await sql`SELECT * FROM settings ORDER BY key ASC`;
}

export async function updateSetting(key, value) {
  return await sql`
    UPDATE settings 
    SET value = ${value} 
    WHERE key = ${key}
    RETURNING *
  `;
}
