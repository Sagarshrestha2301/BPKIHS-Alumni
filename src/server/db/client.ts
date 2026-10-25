import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

/**
 * One pooled connection per process. Next's dev server re-evaluates modules on every
 * edit, so the pool is parked on globalThis to avoid leaking connections.
 *
 * `prepare: false` keeps the driver compatible with Supabase's transaction pooler.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is missing. Copy .env.example to .env.local and start Postgres (npm run db:up).',
  );
}

const globalForDb = globalThis as unknown as {
  bpkihsSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.bpkihsSql ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === 'production' ? 5 : 10,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.bpkihsSql = sql;
}

export const db = drizzle(sql, { schema });
export { schema, sql };
