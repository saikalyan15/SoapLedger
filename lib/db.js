import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

const client = neon(process.env.DATABASE_URL);

// Neon free tier auto-suspends; the first query after wakeup can fail with
// "connection closed". Wrap the client to retry up to 3 times before throwing.
const sql = new Proxy(client, {
  apply(target, thisArg, args) {
    return retry(() => Reflect.apply(target, thisArg, args));
  },
  get(target, prop) {
    const val = target[prop];
    if (typeof val === 'function') {
      return (...args) => retry(() => val.apply(target, args));
    }
    return val;
  },
});

async function retry(fn, attempts = 3, delayMs = 300) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const isConnectionClosed = err?.message?.includes('connection closed') ||
        err?.code === '' && err?.severity === '';
      if (isConnectionClosed && i < attempts - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

export default sql;
