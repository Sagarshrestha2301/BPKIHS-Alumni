import { POST_TYPES, type PostType } from '@/lib/constants/domain';
import { handle, ok } from '@/server/http/respond';
import { listFeed } from '@/server/services/community';

export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const type = params.get('type');

    return ok(
      await listFeed({
        page: Number(params.get('page')) || undefined,
        pageSize: Number(params.get('pageSize')) || undefined,
        q: params.get('q') ?? undefined,
        type: POST_TYPES.includes(type as PostType) ? (type as PostType) : undefined,
        tag: params.get('tag') ?? undefined,
      }),
    );
  });
}
