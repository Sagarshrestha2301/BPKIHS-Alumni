import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';

/** Site-wide numbers for the home page. Same for every visitor, so they are cached. */
export async function getHomeStats() {
  'use cache';
  cacheLife('days');
  return getApiClient().getSiteStats();
}
