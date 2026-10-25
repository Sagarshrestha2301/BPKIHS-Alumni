import type { EventSort } from '@/lib/api/types';
import { EVENT_STATUSES, type EventStatus } from '@/lib/constants/domain';
import { handle, ok } from '@/server/http/respond';
import { listEvents } from '@/server/services/events';

export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const status = params.get('status');
    const sort = params.get('sort');

    return ok(
      await listEvents({
        page: Number(params.get('page')) || undefined,
        pageSize: Number(params.get('pageSize')) || undefined,
        q: params.get('q') ?? undefined,
        status: EVENT_STATUSES.includes(status as EventStatus)
          ? (status as EventStatus)
          : undefined,
        sort: sort === 'soonest' || sort === 'latest' ? (sort as EventSort) : undefined,
      }),
    );
  });
}
