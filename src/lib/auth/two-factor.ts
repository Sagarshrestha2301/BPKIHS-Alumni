/**
 * When does an administrator have to use an authenticator app?
 *
 * The rule is deliberately a pure function: the guards, the admin shell and the tests all
 * agree on one definition, and the decision can be tested without a session, a database or
 * `next/headers`. Production is the only place it applies, so a fresh clone, the browser
 * suite and a preview environment keep working with the seeded administrators that have not
 * enrolled.
 */

export interface AdminTwoFactorUser {
  role?: string | null;
  twoFactorEnabled?: boolean | null;
}

/** Whether the production-administrator rule applies at all, before enrolment is considered. */
export function adminTwoFactorApplies(
  user: AdminTwoFactorUser,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv === 'production' && user.role === 'admin';
}

/**
 * True when this account is an administrator in production and has not turned TOTP on.
 *
 * This is the policy rule used by the tests and by callers that already hold a fresh value.
 * The guards use `adminTwoFactorPending()` instead, because the session cookie carries a
 * cached user for several minutes and that cache must not decide a security question.
 *
 * `undefined` and `null` both mean "not enrolled": a Better Auth user that never started
 * enrolment has no value for the column, and it must not be read as enabled.
 */
export function adminTwoFactorRequired(
  user: AdminTwoFactorUser,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return adminTwoFactorApplies(user, nodeEnv) && user.twoFactorEnabled !== true;
}

/** Shared by the API guard, so the browser and the logs use the same instruction. */
export const ADMIN_TWO_FACTOR_REQUIRED =
  'Two-factor authentication is required for administrators. Set it up at /admin/security.';
