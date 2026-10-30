import { adminBoardInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteBoardMember, updateBoardMember } from '@/server/services/governance';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminBoardInputSchema);
    const member = await updateBoardMember(id, input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'board_member',
      entityId: member.id,
      detail: { name: member.name },
    });
    return ok(member);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const memberId = id;
    const result = await deleteBoardMember(memberId);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'board_member',
      entityId: memberId,
    });
    return ok(result);
  });
}
