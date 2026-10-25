import { helpdeskSchema } from '@/lib/api/schemas';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { submitSupportTicket } from '@/server/services/support';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'support');
    const input = await parseBody(request, helpdeskSchema);
    return ok(await submitSupportTicket(input), 201);
  });
}
