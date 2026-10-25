import { redirect } from 'next/navigation';

import { adminSessionIsStale, type AuthSession, getSession } from './session';

/**
 * Every admin page calls this before it reads anything.
 *
 * The layout guard alone is not enough: Next streams a page while the layout resolves, so an
 * unauthenticated request could otherwise receive the page's HTML (and its data) before the
 * layout's redirect lands. Checking in the page stops the query and the content at the source.
 */
export async function requireAdminPage(): Promise<AuthSession> {
  const session = await getSession();
  if (!session || session.user.role !== 'admin' || adminSessionIsStale(session)) {
    redirect('/admin/sign-in');
  }
  return session;
}
