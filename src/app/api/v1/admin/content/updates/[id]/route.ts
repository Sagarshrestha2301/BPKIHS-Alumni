import { adminGoalUpdateInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteGoalUpdate, updateGoalUpdate } from '@/server/services/donations';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminGoalUpdateInputSchema);
    const update = await updateGoalUpdate(id, input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'goal_update',
      entityId: update.id,
      detail: { goalId: update.goalId },
    });
    return ok(update);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const result = await deleteGoalUpdate(id);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'goal_update',
      entityId: id,
    });
    return ok(result);
  });
}
