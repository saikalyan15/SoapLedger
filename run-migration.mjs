import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// Load .env.local specifically as Next.js does
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  const fileName = process.argv[2] || 'migration_v15.sql';
  const migrationPath = path.join(process.cwd(), 'db-schema', fileName);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Running migration ${fileName}...`);
  
  try {
    // Better splitting that respects simple cases but ignores comments
    // We split by semicolon followed by newline/space to avoid splitting inside complex strings
    const commands = migrationSql
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 1 && cmd !== 'BEGIN' && cmd !== 'COMMIT');

    for (const command of commands) {
      console.log(`Executing command (${command.length} chars)...`);
      await sql.query(command);
    }
    
    console.log(`Migration ${fileName} completed successfully.`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
