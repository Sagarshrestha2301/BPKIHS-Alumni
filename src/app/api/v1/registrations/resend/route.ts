import { resendRegistrationCodeSchema } from '@/lib/api/schemas';
import { assertCsrf } from '@/server/http/csrf';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle, ok, parseBody } from '@/server/http/respond';
import { resendRegistrationCode } from '@/server/services/registration';

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    assertCsrf(request);
    limit(request, 'registrationOtp');
    const input = await parseBody(request, resendRegistrationCodeSchema);
    return ok(await resendRegistrationCode(input));
  });
}
