import { handle, ok } from '@/server/http/respond';
import { getSiteStats } from '@/server/services/content';

export async function GET() {
  return handle(async () => ok(await getSiteStats()));
}
