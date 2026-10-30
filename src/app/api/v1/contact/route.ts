import { contactMessageSchema } from '@/lib/api/schemas';
import { assertHuman } from '@/server/bot/turnstile';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { submitContactMessage } from '@/server/services/support';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    limit(request, 'support');
    const input = await parseBody(request, contactMessageSchema);
    // After parsing, so a field error does not consume the single-use token.
    await assertHuman(request);
    return ok(await submitContactMessage(input), 201);
  });
}
