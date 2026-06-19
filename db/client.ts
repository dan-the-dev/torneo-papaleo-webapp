import { Pool } from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  if (connectionString.includes('.neon.tech')) {
    // Native WebSocket available in Node.js 22+ (Vercel default runtime)
    if (typeof globalThis.WebSocket !== 'undefined') {
      neonConfig.webSocketConstructor = globalThis.WebSocket;
    }
    return new NeonPool({ connectionString }) as unknown as Pool;
  }

  return new Pool({ connectionString });
}

const pool = globalThis.__pgPool ?? createPool();
if (process.env['NODE_ENV'] !== 'production') globalThis.__pgPool = pool;

export default pool;
