import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function withPgSslCompat(connectionString: string): string {
  if (connectionString.includes('uselibpqcompat=')) return connectionString;
  const sep = connectionString.includes('?') ? '&' : '?';
  return `${connectionString}${sep}uselibpqcompat=true`;
}

function createPool(): Pool {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const useSsl =
    process.env['NODE_ENV'] === 'production' ||
    process.env['DATABASE_SSL'] === 'true';

  return new Pool({
    connectionString: useSsl ? withPgSslCompat(connectionString) : connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });
}

// Always cache on globalThis so warm serverless invocations (and dev HMR
// reloads) reuse one pool instead of opening a fresh one per request.
const pool = globalThis.__pgPool ?? createPool();
globalThis.__pgPool = pool;

export default pool;
