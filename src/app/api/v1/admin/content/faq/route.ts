import { adminFaqInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createFaq, listFaqForAdmin } from '@/server/services/content';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listFaqForAdmin());
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminFaqInputSchema);
    const item = await createFaq(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'faq',
      entityId: item.id,
      detail: { question: item.question },
    });
    return ok(item, 201);
  });
}
