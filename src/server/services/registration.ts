import { hashPassword } from 'better-auth/crypto';
import { eq, sql } from 'drizzle-orm';

import { ApiError } from '@/lib/api/errors';
import type { RegistrationInput, ResendRegistrationCodeInput } from '@/lib/api/schemas';
import type { OwnAlumnus, RegistrationResult } from '@/lib/api/types';

import { auth } from '../auth';
import { db } from '../db/client';
import { account, alumni, user } from '../db/schema';
import { toAlumnus } from './alumni';

/**
 * Self-registration creates two things: the profile the Association reviews, and the account
 * that owns it. The account exists so the member can sign in, confirm the email address and
 * watch the review; the profile is what appears in the directory once approved.
 *
 * The account starts as `donor`, not `alumni`: until the Association approves the profile it
 * must not read `alumni_only` directory fields. `approveAlumnus()` grants the alumni role, and
 * `rejectAlumnus()` takes it away again.
 *
 * The password is hashed with the same routine Better Auth uses, because the account row is
 * the one Better Auth signs in against later.
 */

const EMAIL_TAKEN =
  'An account with this email already exists. Sign in instead, or register with another address.';
const PROFILE_TAKEN =
  'A profile with this email is already on file. Contact the office if this is yours and you cannot sign in.';

/** The database's unique index is the real guard; this just gives a friendlier message. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

async function findAccount(email: string) {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  return row;
}

async function findProfileByEmail(email: string) {
  const [row] = await db
    .select()
    .from(alumni)
    .where(sql`lower(${alumni.email}) = ${email}`);
  return row;
}

/**
 * Emails a fresh code. A delivery failure is logged, never thrown: the account already exists
 * at this point, so the person must be able to continue and resend rather than start over.
 * Better Auth sends the message as a background task, so a provider failure is only visible in
 * the log; the form offers a resend either way.
 */
async function sendVerificationCode(email: string): Promise<void> {
  try {
    await auth.api.sendVerificationOTP({ body: { email, type: 'email-verification' } });
  } catch (error) {
    console.error('[registration] could not send the verification code', error);
  }
}

export async function submitRegistration(input: RegistrationInput): Promise<RegistrationResult> {
  const email = input.email.trim().toLowerCase();

  if (await findAccount(email)) throw new ApiError('conflict', EMAIL_TAKEN);

  // A profile imported from the written register has no account yet. Registering with that
  // address claims it instead of creating a duplicate person in the directory.
  const imported = await findProfileByEmail(email);
  if (imported?.userId) throw new ApiError('conflict', PROFILE_TAKEN);

  const userId = crypto.randomUUID();
  const profileId = imported?.id ?? `alumnus-${crypto.randomUUID()}`;
  const now = new Date();
  const password = await hashPassword(input.password);

  const profile = {
    fullName: input.fullName,
    email,
    phone: input.phone || null,
    programme: input.programme,
    batchYear: input.batchYear,
    furtherStudies: input.furtherStudies || null,
    currentPosition: input.currentPosition || null,
    organisation: input.organisation || null,
    city: input.city || null,
    country: input.country,
    note: input.note || null,
    privacyEmail: input.privacy.email,
    privacyPhone: input.privacy.phone,
    privacyProfile: input.privacy.profile,
    status: 'pending' as const,
    source: 'self_registered' as const,
    placeholder: false,
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    updatedAt: now,
  };

  try {
    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: input.fullName,
        email,
        emailVerified: false,
        role: 'donor',
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password,
        createdAt: now,
        updatedAt: now,
      });

      if (imported) {
        await tx
          .update(alumni)
          .set({ ...profile, userId })
          .where(eq(alumni.id, profileId));
      } else {
        await tx.insert(alumni).values({ id: profileId, userId, ...profile });
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError('conflict', EMAIL_TAKEN);
    throw error;
  }

  await sendVerificationCode(email);
  return { id: profileId, status: 'pending', email };
}

/**
 * Sends a new code to an account that has not confirmed its address yet. The reply never says
 * whether the address exists, so this cannot be used to enumerate members.
 */
export async function resendRegistrationCode(
  input: ResendRegistrationCodeInput,
): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  const existing = await findAccount(email);
  if (existing) await sendVerificationCode(email);
  return { ok: true };
}

/** The signed-in member's own profile, or null when the account has no registration. */
export async function findRegistrationForUser(userId: string): Promise<OwnAlumnus | null> {
  const [row] = await db.select().from(alumni).where(eq(alumni.userId, userId));
  if (!row) return null;

  return {
    ...toAlumnus(row),
    ...(row.rejectionReason ? { rejectionReason: row.rejectionReason } : {}),
    photoConsent: row.photoConsent,
  };
}
