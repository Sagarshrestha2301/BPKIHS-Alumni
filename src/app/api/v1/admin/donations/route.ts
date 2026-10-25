import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, pageParam, pageSizeParam } from '@/server/http/respond';
import { listDonationsForAdmin } from '@/server/services/donations';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const params = new URL(request.url).searchParams;
    return ok(
      await listDonationsForAdmin({
        page: pageParam(params.get('page')),
        pageSize: pageSizeParam(params.get('pageSize')),
      }),
    );
  });
}
