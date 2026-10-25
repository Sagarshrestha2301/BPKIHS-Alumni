import { handle, ok } from '@/server/http/respond';
import { getFundsBreakdown } from '@/server/services/donations';

export async function GET() {
  return handle(async () => ok(await getFundsBreakdown()));
}
