import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

const _client = neon(process.env.DATABASE_URL);

// Neon free tier auto-suspends; the first query after wakeup can fail with
// "connection closed". Retry up to 3 times before throwing.
async function retry(fn, attempts = 3, delayMs = 300) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const isConnectionClosed =
        err?.message?.includes('connection closed') ||
        (err?.code === '' && err?.severity === '');
      if (isConnectionClosed && i < attempts - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Tagged template wrapper — forwards strings + values directly to the neon client
function sql(strings, ...values) {
  return retry(() => _client(strings, ...values));
}

export default sql;
