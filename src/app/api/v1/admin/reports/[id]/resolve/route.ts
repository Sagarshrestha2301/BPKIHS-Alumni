import { z } from 'zod';

import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { resolveReport } from '@/server/services/community';

const resolveSchema = z.object({ action: z.enum(['reviewed', 'dismissed']) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const { action } = await parseBody(request, resolveSchema);
    const result = await resolveReport(id, action, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action,
      entity: 'report',
      entityId: id,
    });
    return ok(result);
  });
}
