import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new Pool({
    connectionString,
    ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
  });
}

// Always cache on globalThis so warm serverless invocations (and dev HMR
// reloads) reuse one pool instead of opening a fresh one per request.
const pool = globalThis.__pgPool ?? createPool();
globalThis.__pgPool = pool;

export default pool;
