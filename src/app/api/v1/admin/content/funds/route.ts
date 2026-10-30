import { adminFundInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createFundRow, listFundsForAdmin } from '@/server/services/donations';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listFundsForAdmin());
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminFundInputSchema);
    const row = await createFundRow(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'funds_breakdown',
      entityId: row.id,
      detail: { category: row.category, sharePercent: row.sharePercent },
    });
    return ok(row, 201);
  });
}
