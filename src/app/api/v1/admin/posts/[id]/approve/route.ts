import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { moderatePost } from '@/server/services/community';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const result = await moderatePost(id, 'approve', session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'approve',
      entity: 'post',
      entityId: id,
    });
    return ok(result);
  });
}
