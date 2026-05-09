import { neon, neonConfig } from '@neondatabase/serverless';

// Reuse HTTP connections across requests — prevents "connection closed" on cold starts
neonConfig.fetchConnectionCache = true;

const sqlProxy = (url) => {
  if (!url) {
    return (...args) => {
      throw new Error('DATABASE_URL is not set. Database connection failed.');
    };
  }
  return neon(url);
};

const sql = sqlProxy(process.env.DATABASE_URL);
export default sql;
