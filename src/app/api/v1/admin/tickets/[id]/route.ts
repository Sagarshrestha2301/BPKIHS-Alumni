import { z } from 'zod';

import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { setTicketStatus } from '@/server/services/support';

const patchSchema = z.object({ status: z.enum(['open', 'in_progress', 'closed']) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const { status } = await parseBody(request, patchSchema);
    const result = await setTicketStatus(id, status);
    await writeAudit({
      actorId: session.user.id,
      action: 'status',
      entity: 'ticket',
      entityId: id,
      detail: { status },
    });
    return ok(result);
  });
}
