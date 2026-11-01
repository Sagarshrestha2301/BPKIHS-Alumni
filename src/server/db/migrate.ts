/**
 * Applies the SQL migrations in `drizzle/` using the runtime database driver, so a release
 * step does not need drizzle-kit or a separate build tool.
 *
 *   npm run db:migrate:prod
 *
 * Idempotent: Drizzle records applied migrations and skips them on the next run.
 *
 * Migrations use the direct (unpooled) connection string: PgBouncer transaction pooling
 * does not support the session-level statements migration tools rely on.
 */
import './load-env';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import * as schema from './schema';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing.');
  }
  const sql = postgres(connectionString, { max: 1, prepare: true, connect_timeout: 10 });
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: 'drizzle' });
  await sql.end();
  console.log('Migrations applied.');
}

main().catch(async (error: unknown) => {
  console.error(error);
  process.exit(1);
});
