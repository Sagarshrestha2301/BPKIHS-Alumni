import { handle, ok } from '@/server/http/respond';
import { listBoard } from '@/server/services/governance';

export async function GET(request: Request) {
  return handle(async () => {
    const current = new URL(request.url).searchParams.get('current');
    return ok(await listBoard({ current: current !== 'false' }));
  });
}
