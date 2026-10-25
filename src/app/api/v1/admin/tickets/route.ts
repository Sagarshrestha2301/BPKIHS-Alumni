import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import type { TicketStatus } from '@/server/services/support';
import { listTicketsForAdmin } from '@/server/services/support';

const STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'closed'];

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const status = new URL(request.url).searchParams.get('status');
    return ok(
      await listTicketsForAdmin(
        STATUSES.includes(status as TicketStatus) ? (status as TicketStatus) : undefined,
      ),
    );
  });
}
