import { ApiError } from '@/lib/api/errors';
import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok, pageParam, pageSizeParam } from '@/server/http/respond';
import { DONATION_STATUSES, listDonationsForAdmin } from '@/server/services/donations';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const params = new URL(request.url).searchParams;
    const requestedStatus = params.get('status');
    const status = DONATION_STATUSES.find((value) => value === requestedStatus);
    if (requestedStatus && !status) {
      throw new ApiError('validation', 'status must be pending, succeeded or failed.');
    }

    return ok(
      await listDonationsForAdmin({
        page: pageParam(params.get('page')),
        pageSize: pageSizeParam(params.get('pageSize')),
        status,
        q: params.get('q')?.trim().slice(0, 100),
      }),
    );
  });
}
