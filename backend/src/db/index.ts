import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env.js';
import * as schema from './schema.js';

declare global {
  // eslint-disable-next-line no-var
  var _storedashPool: Pool | undefined;
}

function buildPool(): Pool {
  // TLS need is a property of the target database, not of NODE_ENV — a local
  // dev server can (and often does) point at a hosted database (Neon, Cloud
  // SQL, Render Postgres) that requires TLS even during development.
  //
  // - Cloud SQL Unix socket connections (via the Cloud SQL Auth Proxy, e.g.
  //   .../cloudsql/PROJECT:REGION:INSTANCE) don't use TLS — the proxy
  //   handles encryption.
  // - A plain localhost Postgres (the common local-dev case) doesn't need
  //   or support TLS.
  // - Everything else — Neon, a public Cloud SQL IP, Render Postgres — does.
  const isSocketConnection = env.databaseUrl.includes('/cloudsql/');
  const isLocalHost = /:\/\/[^@]*@?(localhost|127\.0\.0\.1)/.test(env.databaseUrl);
  const ssl = !isSocketConnection && !isLocalHost ? { rejectUnauthorized: false } : undefined;

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
