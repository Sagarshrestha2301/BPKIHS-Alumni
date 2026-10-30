import { rsvpSchema } from '@/lib/api/schemas';
import { assertHuman } from '@/server/bot/turnstile';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { submitRsvp } from '@/server/services/events';

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'rsvp');
    const { slug } = await context.params;
    const input = await parseBody(request, rsvpSchema);
    // After parsing, so a field error does not consume the single-use token.
    await assertHuman(request);
    return ok(await submitRsvp(slug, input), 201);
  });
}
