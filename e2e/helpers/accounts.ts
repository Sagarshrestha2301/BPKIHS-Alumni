import '../../src/server/db/load-env';

import { hashPassword } from 'better-auth/crypto';
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

/**
 * Creates a throwaway administrator for the two-factor spec.
 *
 * The shared fixture admin must never be used: completing enrolment replaces its session,
 * and every other spec reuses the stored one. This account exists only for one test and is
 * deleted afterwards, which also cascades its sessions and authenticator.
 */
export async function createTestAdmin(input: {
  email: string;
  password: string;
  name: string;
}): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [existing] = await sql<{ id: string }[]>`
      select id from "user" where email = ${input.email}
    `;
    const id = existing?.id ?? crypto.randomUUID();

    if (existing) {
      await sql`
        update "user"
        set name = ${input.name},
            role = 'admin'::user_role,
            email_verified = true,
            two_factor_enabled = false,
            banned = false,
            updated_at = now()
        where id = ${id}
      `;
      await sql`delete from account where user_id = ${id}`;
      await sql`delete from two_factor where user_id = ${id}`;
    } else {
      await sql`
        insert into "user" (id, name, email, email_verified, role, created_at, updated_at)
        values (${id}, ${input.name}, ${input.email}, true, 'admin'::user_role, now(), now())
      `;
    }

    await sql`
      insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
      values (
        ${crypto.randomUUID()},
        ${id},
        'credential',
        ${id},
        ${await hashPassword(input.password)},
        now(),
        now()
      )
    `;
  } finally {
    await sql.end();
  }
}

/** Deletes a throwaway account; sessions, credentials and the authenticator cascade. */
export async function deleteTestAccount(email: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql`delete from "user" where email = ${email}`;
  } finally {
    await sql.end();
  }
}

/** Reads the stored role, so a spec can prove the approval transition happened. */
export async function readUserRole(email: string): Promise<string | null> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [row] = await sql<{ role: string }[]>`
      select role::text from "user" where email = ${email}
    `;
    return row?.role ?? null;
  } finally {
    await sql.end();
  }
}
