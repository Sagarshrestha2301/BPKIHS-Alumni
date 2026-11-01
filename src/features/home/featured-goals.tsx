import { getCachedNow, getGoalGiftStats } from '@/features/donations/get-donate-data';
import { FeaturedGoalsView } from '@/features/home/featured-goals-view';
import { getFeaturedGoals } from '@/features/home/get-home-data';

/** Server component: fetches the cached goals, their gift counts and a prerender-safe clock. */
export async function FeaturedGoals() {
  // All reads are cached; the aggregate queries add no per-card work when the section paints.
  const [goals, giftStats, now] = await Promise.all([
    getFeaturedGoals(),
    getGoalGiftStats(),
    getCachedNow(),
  ]);
  return <FeaturedGoalsView goals={goals} giftStats={giftStats} now={now} />;
}
