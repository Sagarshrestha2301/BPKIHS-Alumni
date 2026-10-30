import { adminGoalInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteGoal, updateGoal } from '@/server/services/donations';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminGoalInputSchema);
    const goal = await updateGoal(id, input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'goal',
      entityId: goal.id,
      detail: { title: goal.title },
    });
    return ok(goal);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const goalId = id;
    const result = await deleteGoal(goalId);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'goal',
      entityId: goalId,
    });
    return ok(result);
  });
}
