import { newsletterPrefsSchema, newsletterSubscribeSchema } from '@/lib/api/schemas';
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
    return ok(await subscribeNewsletter(input), 201);
  });
}

export async function PATCH(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'newsletter');
    const input = await parseBody(request, newsletterPrefsSchema);
    return ok(await updateNewsletterPrefs(input));
  });
}
