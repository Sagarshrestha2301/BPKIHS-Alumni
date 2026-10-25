import { ANONYMOUS_VIEWER } from '@/server/auth/session';
import { handle, ok } from '@/server/http/respond';
import { getAlumniFilterOptions } from '@/server/services/alumni';

export async function GET() {
  return handle(async () => ok(await getAlumniFilterOptions(ANONYMOUS_VIEWER)));
}
