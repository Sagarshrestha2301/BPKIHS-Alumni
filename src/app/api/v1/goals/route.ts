import { handle, ok } from '@/server/http/respond';
import { listGoals } from '@/server/services/donations';

export async function GET() {
  return handle(async () => ok(await listGoals()));
}
