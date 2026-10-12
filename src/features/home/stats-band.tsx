import { getHomeStats } from '@/features/home/get-home-data';
import { StatsBandView } from '@/features/home/stats-band-view';
import { resolveApiMode } from '@/lib/api/client';

/** Server component: fetches the cached stats and renders the band. */
export async function StatsBand() {
  const stats = await getHomeStats();
  const sample = resolveApiMode(process.env.NEXT_PUBLIC_API_MODE) === 'mock';
  return <StatsBandView stats={stats} sample={sample} />;
}
