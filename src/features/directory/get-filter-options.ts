import { cacheLife } from 'next/cache';

import { getServerApiClient } from '@/server/api/server-client';

/** The countries and batch years the filter menus offer. Cached like the other data helpers. */
export async function getAlumniFilterOptions() {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().getAlumniFilterOptions();
}
