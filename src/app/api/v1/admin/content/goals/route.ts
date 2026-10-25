import { adminGoalInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createGoal, listGoalsForAdmin } from '@/server/services/donations';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listGoalsForAdmin());
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminGoalInputSchema);
    const goal = await createGoal(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'goal',
      entityId: goal.id,
      detail: { title: goal.title },
    });
    return ok(goal, 201);
  });
}
