import { cacheLife } from 'next/cache';

import type { AlumniListParams } from '@/lib/api/types';
import { getServerApiClient } from '@/server/api/server-client';

/** One page of alumni for the given search. Cached per distinct set of parameters. */
export async function getAlumniPage(params: AlumniListParams) {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().listAlumni(params);
}
