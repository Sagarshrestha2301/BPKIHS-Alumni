import { adminFaqInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteFaq, updateFaq } from '@/server/services/content';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminFaqInputSchema);
    const item = await updateFaq(id, input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'faq',
      entityId: item.id,
      detail: { question: item.question },
    });
    return ok(item);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const faqId = id;
    const result = await deleteFaq(faqId);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'faq',
      entityId: faqId,
    });
    return ok(result);
  });
}
