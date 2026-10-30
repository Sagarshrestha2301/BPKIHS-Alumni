import type { AlumniSort } from '@/lib/api/types';
import { type Programme, PROGRAMMES } from '@/lib/constants/domain';
import { getViewer } from '@/server/auth/session';
import { handle, ok } from '@/server/http/respond';
import { listAlumni } from '@/server/services/alumni';

const SORTS: readonly AlumniSort[] = ['name', 'batch_newest', 'batch_oldest', 'recently_joined'];

export async function GET(request: Request) {
  return handle(async () => {
    // Anyone may browse public profiles; the viewer decides which records and fields are
    // returned. Members-only profiles stay hidden from signed-out visitors.
    const viewer = await getViewer();
    const params = new URL(request.url).searchParams;
    const programme = params.get('programme');
    const sort = params.get('sort');
    const batchYear = Number(params.get('batchYear'));
    const furtherStudies = params.get('furtherStudies');

    return ok(
      await listAlumni(
        {
          page: Number(params.get('page')) || undefined,
          pageSize: Number(params.get('pageSize')) || undefined,
          q: params.get('q') ?? undefined,
          sort: SORTS.includes(sort as AlumniSort) ? (sort as AlumniSort) : undefined,
          programme: PROGRAMMES.includes(programme as Programme)
            ? (programme as Programme)
            : undefined,
          batchYear: Number.isFinite(batchYear) && batchYear > 0 ? batchYear : undefined,
          country: params.get('country') ?? undefined,
          city: params.get('city') ?? undefined,
          furtherStudies:
            furtherStudies === 'true' ? true : furtherStudies === 'false' ? false : undefined,
        },
        viewer,
      ),
    );
  });
}
