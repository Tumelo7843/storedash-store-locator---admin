import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env.js';
import * as schema from './schema.js';

declare global {
  // eslint-disable-next-line no-var
  var _storedashPool: Pool | undefined;
}

function buildPool(): Pool {
  // Cloud SQL Unix socket connections (via the Cloud SQL Auth Proxy, e.g.
  // .../cloudsql/PROJECT:REGION:INSTANCE) don't use TLS — the proxy handles
  // encryption. Anything else (Render Postgres, a public Cloud SQL IP) needs
  // TLS in production.
  const isSocketConnection = env.databaseUrl.includes('/cloudsql/');
  const ssl = !isSocketConnection && env.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined;

  const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle Postgres client:', err);
  });

  return pool;
}

// Reuse a single pool across hot reloads / module re-imports in dev.
export const pool = globalThis._storedashPool ?? buildPool();
if (env.nodeEnv !== 'production') {
  globalThis._storedashPool = pool;
}

export const db = drizzle(pool, { schema });
