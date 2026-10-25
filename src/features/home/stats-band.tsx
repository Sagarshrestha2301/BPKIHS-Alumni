import { getHomeStats } from '@/features/home/get-home-data';
import { StatsBandView } from '@/features/home/stats-band-view';

/** Server component: fetches the cached stats and renders the band. */
export async function StatsBand() {
  const stats = await getHomeStats();
  return <StatsBandView stats={stats} />;
}
