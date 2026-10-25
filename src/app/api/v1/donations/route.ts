import { donationSchema } from '@/lib/api/schemas';
import { requireSession } from '@/server/auth/session';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { createDonation } from '@/server/services/donations';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    const session = await requireSession();
    limit(request, 'donation');
    const input = await parseBody(request, donationSchema);
    return ok(
      await createDonation(input, {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }),
      201,
    );
  });
}
