import { adminFundInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { deleteFundRow, updateFundRow } from '@/server/services/donations';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const input = await parseBody(request, adminFundInputSchema);
    const row = await updateFundRow(id, input);
    await writeAudit({
      actorId: session.user.id,
      action: 'update',
      entity: 'funds_breakdown',
      entityId: row.id,
      detail: { category: row.category, sharePercent: row.sharePercent },
    });
    return ok(row);
  });
}

export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const { id } = await context.params;
    const fundId = id;
    const result = await deleteFundRow(fundId);
    await writeAudit({
      actorId: session.user.id,
      action: 'delete',
      entity: 'funds_breakdown',
      entityId: fundId,
    });
    return ok(result);
  });
}
