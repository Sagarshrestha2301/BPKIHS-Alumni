import { rsvpSchema } from '@/lib/api/schemas';
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
    return ok(await submitRsvp(decodeURIComponent(slug), input), 201);
  });
}
