import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new Pool({ connectionString });
}

const pool = globalThis.__pgPool ?? createPool();
if (process.env['NODE_ENV'] !== 'production') globalThis.__pgPool = pool;

export default pool;
