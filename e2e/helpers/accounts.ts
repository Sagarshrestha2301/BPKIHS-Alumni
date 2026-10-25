import '../../src/server/db/load-env';

import postgres from 'postgres';

/**
 * Marks an account's address as confirmed.
 *
 * The browser suite does not deliver email (that needs a provider), so it cannot read the
 * one-time code. The code flow itself is exercised outside Playwright (see `docs/HOWTO.md`
 * section 7). What the suite needs here is a confirmed address, because the dashboard refuses
 * to approve a self-registration whose owner never confirmed it.
 */
export async function confirmEmail(email: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql`update "user" set email_verified = true where email = ${email}`;
  } finally {
    await sql.end();
  }
}
