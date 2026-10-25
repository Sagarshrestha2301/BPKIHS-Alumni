import { handle, ok } from '@/server/http/respond';
import { getGoal } from '@/server/services/donations';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await context.params;
    return ok(await getGoal(decodeURIComponent(id)));
  });
}
