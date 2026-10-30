import { handle, ok } from '@/server/http/respond';
import { getPost } from '@/server/services/community';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await context.params;
    return ok(await getPost(id));
  });
}
