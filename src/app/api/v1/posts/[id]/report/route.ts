import { postReportSchema } from '@/lib/api/schemas';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { reportPost } from '@/server/services/community';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'report');
    const { id } = await context.params;
    const input = await parseBody(request, postReportSchema);
    return ok(await reportPost(decodeURIComponent(id), input));
  });
}
