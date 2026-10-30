import { handle, ok } from '@/server/http/respond';
import { getEvent } from '@/server/services/events';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await context.params;
    return ok(await getEvent(slug));
  });
}
