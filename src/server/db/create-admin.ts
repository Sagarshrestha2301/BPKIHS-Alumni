/**
 * Creates or promotes the first administrator without touching any other rows.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="..." npm run db:admin
 *
 * Safe to run more than once. If the account already exists it is promoted to `admin`
 * and its password is set to the one supplied, which also makes this the recovery path.
 * Nothing here is seeded: a production database starts with one admin and no content.
 */
import './load-env';

import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db, sql } from './client';
import { account, user } from './schema';

const WEAK_PASSWORDS = new Set(['admin12345!', 'password123!', 'changeme123!']);

const inputSchema = z.object({
  ADMIN_EMAIL: z.email('ADMIN_EMAIL must be a valid email address.'),
  ADMIN_PASSWORD: z
    .string()
    .min(12, 'ADMIN_PASSWORD must be at least 12 characters.')
    .refine((value) => !WEAK_PASSWORDS.has(value.toLowerCase()), 'Choose a stronger password.'),
  ADMIN_NAME: z.string().trim().min(1, 'ADMIN_NAME cannot be empty.').default('Association Admin'),
});

async function main(): Promise<void> {
  const parsed = inputSchema.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) console.error(`- ${issue.message}`);
    throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD and optionally ADMIN_NAME.');
  }

  const email = parsed.data.ADMIN_EMAIL.trim().toLowerCase();
  const name = parsed.data.ADMIN_NAME;
  const now = new Date();
  const [existing] = await db.select().from(user).where(eq(user.email, email));

  let userId: string;
  if (existing) {
    userId = existing.id;
    await db
      .update(user)
      .set({ name, role: 'admin', emailVerified: true, updatedAt: now })
      .where(eq(user.id, existing.id));
  } else {
    userId = crypto.randomUUID();
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    });
  }

  const password = await hashPassword(parsed.data.ADMIN_PASSWORD);
  const [credential] = await db.select().from(account).where(eq(account.userId, userId));
  if (credential) {
    await db.update(account).set({ password, updatedAt: now }).where(eq(account.id, credential.id));
  } else {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(
    existing ? `Promoted ${email} to admin and reset its password.` : `Created admin ${email}.`,
  );
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
