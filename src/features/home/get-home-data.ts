import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';

/** Site-wide numbers for the home page. Same for every visitor, so they are cached. */
export async function getHomeStats() {
  'use cache';
  cacheLife('days');
  return getApiClient().getSiteStats();
}

/** The first three giving goals (the general fund comes first in the data). */
export async function getFeaturedGoals() {
  'use cache';
  cacheLife('days');
  const goals = await getApiClient().listGoals();
  return goals.slice(0, 3);
}
