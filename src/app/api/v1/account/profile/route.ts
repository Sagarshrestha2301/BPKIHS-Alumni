import { profileUpdateSchema } from '@/lib/api/schemas';
import { requireSession } from '@/server/auth/session';
import { revalidateDirectory } from '@/server/cache';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { updateOwnProfile } from '@/server/services/account';

/**
 * PATCH /api/v1/account/profile : the member edits their own record. The service writes only
 * the fields the schema allows; status and identity fields are not part of it.
 */
export async function PATCH(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'profile');
    const session = await requireSession();
    const input = await parseBody(request, profileUpdateSchema);
    const result = await updateOwnProfile(session.user.id, input);
    revalidateDirectory();
    return ok(result);
  });
}
