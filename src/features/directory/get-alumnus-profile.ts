import { cacheLife, cacheTag } from 'next/cache';

import { isApiError } from '@/lib/api/errors';
import type { Viewer } from '@/lib/api/privacy';
import { DIRECTORY_CACHE_TAG } from '@/lib/constants/cache';
import { getServerApiClient } from '@/server/api/server-client';

/**
 * One alumnus profile, or null when it is missing, unapproved or hidden from this viewer (the
 * API treats all three the same). Any other error is rethrown so the route error page handles
 * it. The viewer is part of the cache key, so the public view is never served to an alumnus.
 */
export async function getAlumnusProfile(id: string, viewer: Viewer) {
  'use cache';
  cacheLife('hours');
  cacheTag(DIRECTORY_CACHE_TAG);
  try {
    return await getServerApiClient(viewer).getAlumnus(id);
  } catch (error) {
    if (isApiError(error) && error.code === 'not_found') return null;
    throw error;
  }
}
