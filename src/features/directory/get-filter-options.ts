import { cacheLife, cacheTag } from 'next/cache';

import type { Viewer } from '@/lib/api/privacy';
import { DIRECTORY_CACHE_TAG } from '@/lib/constants/cache';
import { getServerApiClient } from '@/server/api/server-client';

/**
 * The countries and batch years the filter menus offer. Cached per viewer like the rest of
 * the directory, because alumni-only profiles add their countries and batches too.
 */
export async function getAlumniFilterOptions(viewer: Viewer) {
  'use cache';
  cacheLife('hours');
  cacheTag(DIRECTORY_CACHE_TAG);
  return getServerApiClient(viewer).getAlumniFilterOptions();
}
