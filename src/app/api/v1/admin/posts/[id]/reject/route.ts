import { z } from 'zod';

import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { moderatePost } from '@/server/services/community';

const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Give a short reason.').max(500),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const { reason } = await parseBody(request, rejectSchema);
    const result = await moderatePost(decodeURIComponent(id), 'reject', session.user.id, reason);
    await writeAudit({
      actorId: session.user.id,
      action: 'reject',
      entity: 'post',
      entityId: id,
      detail: { reason },
    });
    return ok(result);
  });
}
