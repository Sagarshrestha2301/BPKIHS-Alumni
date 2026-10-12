import { FeaturedGoalsView } from '@/features/home/featured-goals-view';
import { getFeaturedGoals } from '@/features/home/get-home-data';

/** Server component: fetches the cached goals and renders the section. */
export async function FeaturedGoals() {
  const goals = await getFeaturedGoals();
  return <FeaturedGoalsView goals={goals} />;
}
