import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import { approveAlumnus } from '@/server/services/alumni';
import { writeAudit } from '@/server/services/audit';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const result = await approveAlumnus(decodeURIComponent(id), session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'approve',
      entity: 'alumni',
      entityId: id,
    });
    return ok(result);
  });
}
