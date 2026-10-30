import { headers } from 'next/headers';

import { type Viewer, viewerForRole } from '@/lib/api/privacy';
import { ADMIN_TWO_FACTOR_REQUIRED } from '@/lib/auth/two-factor';

import { config } from '../config';
import { AuthError } from './errors';
import { auth } from './index';
import { adminTwoFactorPending } from './two-factor-status';

export { AuthError, type AuthErrorCode } from './errors';
export type { Viewer } from '@/lib/api/privacy';

/** No sign-in means the anonymous viewer, so alumni-only fields stay hidden. */
export const ANONYMOUS_VIEWER: Viewer = { isAlumnus: false };

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Directory visibility for the current request. Only alumni and admins are insiders; a donor
 * account, a pending registration and a signed-out visitor all see the public view.
 */
export async function getViewer(): Promise<Viewer> {
  const session = await getSession();
  return viewerForRole(session?.user.role);
}

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new AuthError('unauthenticated', 'Sign in to continue.');
  }
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireSession();
  if (session.user.role !== 'admin') {
    throw new AuthError('forbidden', 'You do not have permission to do that.');
  }
  if (adminSessionIsStale(session)) {
    throw new AuthError('unauthenticated', 'Your admin session expired. Sign in again.');
  }
  // Production administrators must use an authenticator app. The enrolment page talks to
  // Better Auth directly, so it is not blocked by this API guard; the rest of /api/v1/admin
  // answers 403 until the account finishes enrolment. The live column is read because the
  // session cookie's cached user lags behind enrolment and removal.
  if (await adminTwoFactorPending(session.user)) {
    throw new AuthError('forbidden', ADMIN_TWO_FACTOR_REQUIRED);
  }
  return session;
}

/**
 * Admin actions are high value, so an idle dashboard session expires before the underlying
 * cookie does. Better Auth refreshes `updatedAt` on activity (at most once per updateAge),
 * so a gap longer than the configured window means nobody touched the dashboard. The page
 * guard redirects; the API guard returns 401.
 */
export function adminSessionIsStale(session: AuthSession): boolean {
  const lastSeen = new Date(session.session.updatedAt).getTime();
  if (Number.isNaN(lastSeen)) return true;
  return Date.now() - lastSeen > config.admin.reauthAfterSeconds * 1000;
}
