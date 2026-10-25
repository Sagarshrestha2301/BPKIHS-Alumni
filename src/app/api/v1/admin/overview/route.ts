import { requireAdminRead } from '@/server/http/admin-guard';
import { handle, ok } from '@/server/http/respond';
import { getAdminCounts, getSiteStats } from '@/server/services/content';
import { countSubscribers } from '@/server/services/newsletter';

export async function GET(request: Request) {
  return handle(async () => {
    await requireAdminRead(request);
    const [counts, stats, subscribers] = await Promise.all([
      getAdminCounts(),
      getSiteStats(),
      countSubscribers(),
    ]);
    return ok({ ...counts, ...stats, subscribers });
  });
}
