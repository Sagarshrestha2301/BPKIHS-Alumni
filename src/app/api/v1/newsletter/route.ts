import { newsletterPrefsSchema, newsletterSubscribeSchema } from '@/lib/api/schemas';
import { assertHuman } from '@/server/bot/turnstile';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { subscribeNewsletter, updateNewsletterPrefs } from '@/server/services/community';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'newsletter');
    const input = await parseBody(request, newsletterSubscribeSchema);
    await assertHuman(request);
    return ok(await subscribeNewsletter(input), 201);
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'newsletter');
    const input = await parseBody(request, newsletterPrefsSchema);
    // The preferences form can trigger a confirmation email, so it gets the same check.
    await assertHuman(request);
    return ok(await updateNewsletterPrefs(input));
  });
}
