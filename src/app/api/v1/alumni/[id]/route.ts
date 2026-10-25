import { ANONYMOUS_VIEWER } from '@/server/auth/session';
import { handle, ok } from '@/server/http/respond';
import { getAlumnus } from '@/server/services/alumni';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await context.params;
    return ok(await getAlumnus(decodeURIComponent(id), ANONYMOUS_VIEWER));
  });
}
