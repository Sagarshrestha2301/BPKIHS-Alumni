import { handle, ok, pageParam, pageSizeParam } from '@/server/http/respond';
import { listPublicDonors } from '@/server/services/donations';

/**
 * Confirmed gifts for the transparency page. Public and read-only: no amount, no email and
 * no name for a donor who chose to stay anonymous.
 */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    return ok(
      await listPublicDonors({
        page: pageParam(params.get('page')),
        pageSize: pageSizeParam(params.get('pageSize')),
      }),
    );
  });
}
