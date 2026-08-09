/** Apply one or more SQL migration files through Neon HTTP in one transaction. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local', quiet: true });

const files = process.argv.slice(2);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (files.length === 0) throw new Error('Usage: node scripts/apply-migrations.mjs <migration.sql> [...]');

function splitStatements(source) {
  const statements = [];
  let current = '';
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (lineComment) {
      current += char;
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }
    if (!quote && char === '-' && next === '-') {
      current += char + next;
      i += 1;
      lineComment = true;
      continue;
    }
    if (!quote && char === '/' && next === '*') {
      current += char + next;
      i += 1;
      blockComment = true;
      continue;
    }
    if (!quote && char === "'") {
      quote = "'";
      current += char;
      continue;
    }
    if (quote === "'" && char === "'" && next === "'") {
      current += char + next;
      i += 1;
      continue;
    }
    if (quote === "'" && char === "'") {
      quote = null;
      current += char;
      continue;
    }
    if (!quote && char === '$' && next === '$') {
      quote = '$$';
      current += '$$';
      i += 1;
      continue;
    }
    if (quote === '$$' && char === '$' && next === '$') {
      quote = null;
      current += '$$';
      i += 1;
      continue;
    }
    if (!quote && char === ';') {
      const statement = current.trim();
      if (statement && !/^(BEGIN|COMMIT)$/i.test(statement.replace(/^--.*$/gm, '').trim())) statements.push(statement);
      current = '';
      continue;
    }
    current += char;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

const sql = neon(process.env.DATABASE_URL);
const statements = [];
for (const file of files) {
  const source = await readFile(resolve(file), 'utf8');
  statements.push(...splitStatements(source));
}

await sql.transaction(txn => statements.map(statement => txn.query(statement, [])));
console.log(`Applied ${files.length} migration file(s) in one transaction.`);
