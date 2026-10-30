import { connection } from 'next/server';

import { SignInGate } from '@/components/shared/sign-in-gate';
import { communityPage } from '@/content/community';
import { SharePostForm } from '@/features/community/share-post-form';
import { getSession } from '@/server/auth/session';

/**
 * Only a signed-in member can share an update. Read inside the page's Suspense boundary, so
 * the public part of the feed still ships in the static shell and the answer streams in.
 *
 * `connection()` makes that boundary wait for the request before the session lookup. Better
 * Auth compares the session's expiry with `Date.now()`, and Cache Components refuses that
 * value during prerendering, so the read cannot happen while the shell is built.
 */
export async function ShareGate() {
  await connection();
  const session = await getSession();
  if (!session) {
    const gate = communityPage.signInGate;
    return (
      <SignInGate
        title={gate.title}
        text={gate.text}
        signInLabel={gate.signIn}
        registerLabel={gate.register}
        next="/community"
      />
    );
  }

  return (
    <SharePostForm
      author={{
        name: session.user.name.trim() || session.user.email,
        email: session.user.email,
      }}
    />
  );
}
