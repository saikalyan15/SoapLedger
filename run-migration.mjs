import sql from './lib/db.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const migrationPath = path.join(process.cwd(), 'db-schema', 'migration_v4.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration v4.0...');
  
  try {
    // Split by BEGIN/COMMIT or just run as one block if supported by the driver
    // Neon's serverless driver supports multi-statement strings
    await sql.unsafe(migrationSql);
    console.log('Migration v4.0 completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
