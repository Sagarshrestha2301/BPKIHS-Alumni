import { cacheLife } from 'next/cache';

import { isApiError } from '@/lib/api/errors';
import { getServerApiClient } from '@/server/api/server-client';

/**
 * One alumnus profile, or null when it is missing, unapproved or hidden (the API treats all
 * three the same). Any other error is rethrown so the route error page handles it.
 */
export async function getAlumnusProfile(id: string) {
  'use cache';
  cacheLife('hours');
  try {
    return await getServerApiClient().getAlumnus(id);
  } catch (error) {
    if (isApiError(error) && error.code === 'not_found') return null;
    throw error;
  }
}
