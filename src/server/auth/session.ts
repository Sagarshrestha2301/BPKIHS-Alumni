import { headers } from 'next/headers';

import { config } from '../config';
import { AuthError } from './errors';
import { auth } from './index';

export { AuthError, type AuthErrorCode } from './errors';

export type Viewer = { isAlumnus: boolean };

/** No sign-in means the anonymous viewer, so alumni-only fields stay hidden (D29). */
export const ANONYMOUS_VIEWER: Viewer = { isAlumnus: false };

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
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
