import { APPROVAL_STATUSES, type ApprovalStatus } from '@/lib/constants/domain';
import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import { listAlumniForAdmin } from '@/server/services/alumni';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const params = new URL(request.url).searchParams;
    const status = params.get('status');
    return ok(
      await listAlumniForAdmin({
        status: APPROVAL_STATUSES.includes(status as ApprovalStatus)
          ? (status as ApprovalStatus)
          : undefined,
        q: params.get('q') ?? undefined,
        page: Number(params.get('page')) || undefined,
        pageSize: Number(params.get('pageSize')) || undefined,
      }),
    );
  });
}
