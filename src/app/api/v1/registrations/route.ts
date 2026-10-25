import { registrationSchema } from '@/lib/api/schemas';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { submitRegistration } from '@/server/services/registration';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'registration');
    const input = await parseBody(request, registrationSchema);
    return ok(await submitRegistration(input), 201);
  });
}
