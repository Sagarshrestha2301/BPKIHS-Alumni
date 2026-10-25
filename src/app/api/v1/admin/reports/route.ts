import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import { listOpenReports } from '@/server/services/community';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    return ok(await listOpenReports());
  });
}
