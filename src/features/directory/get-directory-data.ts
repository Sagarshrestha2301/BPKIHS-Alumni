import { cacheLife, cacheTag } from 'next/cache';

import type { Viewer } from '@/lib/api/privacy';
import type { AlumniListParams } from '@/lib/api/types';
import { DIRECTORY_CACHE_TAG } from '@/lib/constants/cache';
import { getServerApiClient } from '@/server/api/server-client';

/**
 * One page of alumni for the given search. Cached per distinct set of parameters, including
 * the viewer: the public and alumni views must never share an entry.
 */
export async function getAlumniPage(params: AlumniListParams, viewer: Viewer) {
  'use cache';
  cacheLife('hours');
  cacheTag(DIRECTORY_CACHE_TAG);
  return getServerApiClient(viewer).listAlumni(params);
}
