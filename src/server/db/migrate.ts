/**
 * Applies the SQL migrations in `drizzle/` using the runtime database driver, so a release
 * step does not need drizzle-kit or a separate build tool.
 *
 *   npm run db:migrate:prod
 *
 * Idempotent: Drizzle records applied migrations and skips them on the next run.
 */
import './load-env';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { db, sql } from './client';

async function main(): Promise<void> {
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations applied.');
}

main()
  .then(async () => {
    await sql.end();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });
