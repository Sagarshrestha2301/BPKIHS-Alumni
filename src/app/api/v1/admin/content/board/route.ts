import { adminBoardInputSchema } from '@/lib/api/admin-schemas';
import { requireAdminMutation, requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, parseBody } from '@/server/http/respond';
import { writeAudit } from '@/server/services/audit';
import { createBoardMember, listBoardForAdmin } from '@/server/services/governance';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listBoardForAdmin());
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const session = await requireAdminMutation(request);
    const input = await parseBody(request, adminBoardInputSchema);
    const member = await createBoardMember(input);
    await writeAudit({
      actorId: session.user.id,
      action: 'create',
      entity: 'board_member',
      entityId: member.id,
      detail: { name: member.name },
    });
    return ok(member, 201);
  });
}
