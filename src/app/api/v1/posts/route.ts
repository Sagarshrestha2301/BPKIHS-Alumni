import { memberPostSchema } from '@/lib/api/schemas';
import { requireSession } from '@/server/auth/session';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { submitPost } from '@/server/services/community';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'post');
    // Sharing an update is a members-only action.
    const session = await requireSession();
    const input = await parseBody(request, memberPostSchema);
    // The byline comes from the account, so a signed-in member cannot post as someone else.
    return ok(
      await submitPost({
        ...input,
        authorName: session.user.name || input.authorName,
        authorEmail: session.user.email,
      }),
      201,
    );
  });
}
