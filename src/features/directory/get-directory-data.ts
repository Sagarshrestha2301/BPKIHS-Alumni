import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';
import type { AlumniListParams } from '@/lib/api/types';

/** One page of alumni for the given search. Cached per distinct set of parameters. */
export async function getAlumniPage(params: AlumniListParams) {
  'use cache';
  cacheLife('hours');
  return getApiClient().listAlumni(params);
}
