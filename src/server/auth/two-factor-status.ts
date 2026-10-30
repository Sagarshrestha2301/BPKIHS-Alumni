import { eq } from 'drizzle-orm';

import { adminTwoFactorApplies } from '@/lib/auth/two-factor';

import { db } from '../db/client';
import { user } from '../db/schema';

export interface TwoFactorLookupUser {
  id: string;
  role?: string | null;
}

/**
 * The live enrolment answer for a production administrator.
 *
 * The session cookie carries a cached user for a few minutes (`SESSION_COOKIE_CACHE_MINUTES`).
 * Immediately after enrolment that cache still says "not enrolled", which would keep a
 * just-enrolled administrator locked out; immediately after removal it still says "enrolled",
 * which would leave the dashboard open. The access decision therefore reads the column that
 * Better Auth's enrolment endpoint writes, not the cached copy.
 *
 * Only production administrators reach the query. Every other request answers `false` without
 * touching the database.
 */
export async function adminTwoFactorPending(account: TwoFactorLookupUser): Promise<boolean> {
  if (!adminTwoFactorApplies({ role: account.role })) return false;

  const [row] = await db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, account.id));

  return row?.twoFactorEnabled !== true;
}
