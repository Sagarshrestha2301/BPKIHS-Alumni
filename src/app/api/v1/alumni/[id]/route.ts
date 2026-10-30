import { getViewer } from '@/server/auth/session';
import { handle, ok } from '@/server/http/respond';
import { getAlumnus } from '@/server/services/alumni';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    // Public profiles are readable by anyone; members-only ones answer 404 so a guess cannot
    // reveal that a record exists.
    const viewer = await getViewer();
    const { id } = await context.params;
    return ok(await getAlumnus(id, viewer));
  });
}
