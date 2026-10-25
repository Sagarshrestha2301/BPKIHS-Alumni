import '../../src/server/db/load-env';

import { hashPassword } from 'better-auth/crypto';
import postgres from 'postgres';

import { ADMIN, DONOR, SCHOLARSHIP_GOAL_ID } from './storage';

/**
 * Creates what the browser suite signs in as and pays towards.
 *
 * The application deliberately seeds nothing, so the suite brings its own fixtures: one admin,
 * one donor and the scholarship goal the checkout spec links to. They are written straight to
 * the development database before any browser test runs and are safe to run repeatedly.
 *
 * Credentials here are throwaway development values. Nothing in this file is imported by
 * application code, and the production bootstrap stays `npm run db:admin`.
 */

interface SeedAccount {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'donor' | 'alumni';
}

async function upsertAccount(sql: postgres.Sql, account: SeedAccount): Promise<string> {
  const [existing] = await sql<{ id: string }[]>`
    select id from "user" where email = ${account.email}
  `;
  const id = existing?.id ?? crypto.randomUUID();

  if (existing) {
    await sql`
      update "user"
      set name = ${account.name},
          role = ${account.role}::user_role,
          email_verified = true,
          banned = false,
          updated_at = now()
      where id = ${id}
    `;
    // Replace the credential so a rerun always leaves the password the specs expect.
    await sql`delete from account where user_id = ${id}`;
  } else {
    await sql`
      insert into "user" (id, name, email, email_verified, role, created_at, updated_at)
      values (${id}, ${account.name}, ${account.email}, true, ${account.role}::user_role, now(), now())
    `;
  }

  await sql`
    insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
    values (
      ${crypto.randomUUID()},
      ${id},
      'credential',
      ${id},
      ${await hashPassword(account.password)},
      now(),
      now()
    )
  `;

  return id;
}

export async function seedFixtures(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await upsertAccount(sql, { ...ADMIN, role: 'admin' });
    await upsertAccount(sql, { ...DONOR, role: 'donor' });

    // The goal has to be open so checkout is allowed to start against it.
    await sql`
      insert into donation_goals (
        id, title, description, target_minor, raised_minor, currency, active, sort_order,
        created_at, updated_at
      )
      values (
        ${SCHOLARSHIP_GOAL_ID},
        'Scholarships for students in need',
        'Covers tuition and living costs for students who would otherwise have to leave the programme.',
        500000000,
        125000000,
        'NPR',
        true,
        0,
        now(),
        now()
      )
      on conflict (id) do update
      set title = excluded.title,
          description = excluded.description,
          target_minor = excluded.target_minor,
          active = true,
          updated_at = now()
    `;
  } finally {
    await sql.end();
  }
}
