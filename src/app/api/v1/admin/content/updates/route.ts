import { adminGoalUpdateInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createGoalUpdate } from '@/server/services/donations';

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminGoalUpdateInputSchema);
    const update = await createGoalUpdate(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'goal_update',
      entityId: update.id,
      detail: { goalId: update.goalId },
    });
    return ok(update, 201);
  });
}
