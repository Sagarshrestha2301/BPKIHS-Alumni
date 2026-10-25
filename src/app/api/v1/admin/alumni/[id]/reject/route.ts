import { z } from 'zod';

import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { rejectAlumnus } from '@/server/services/alumni';
import { writeAudit } from '@/server/services/audit';

const rejectSchema = z.object({
  reason: z.string().trim().min(3, 'Give a short reason.').max(500),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const { reason } = await parseBody(request, rejectSchema);
    const result = await rejectAlumnus(decodeURIComponent(id), reason, session.user.id);
    await writeAudit({
      actorId: session.user.id,
      action: 'reject',
      entity: 'alumni',
      entityId: id,
      detail: { reason },
    });
    return ok(result);
  });
}
