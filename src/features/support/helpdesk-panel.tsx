import { connection } from 'next/server';

import { HelpdeskForm } from '@/features/support/helpdesk-form';
import { getSession } from '@/server/auth/session';

/**
 * The helpdesk form for everyone.
 *
 * A visitor can write the whole message without an account; the form itself asks for sign-in
 * when Send is pressed. Read inside the page's Suspense boundary, so the contact details
 * around it stay in the static shell.
 *
 * `connection()` defers the lookup to the request: Better Auth reads `Date.now()` while it
 * checks the cookie, which Cache Components blocks while prerendering the shell.
 */
export async function HelpdeskPanel() {
  await connection();
  const session = await getSession();

  return (
    <HelpdeskForm
      author={
        session
          ? {
              name: session.user.name.trim() || session.user.email,
              email: session.user.email,
            }
          : null
      }
    />
  );
}
