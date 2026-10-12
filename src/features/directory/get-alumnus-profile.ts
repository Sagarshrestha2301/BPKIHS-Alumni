import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';

/**
 * One alumnus profile, or null when it is missing, unapproved or hidden (the API treats all
 * three the same). Any other error is rethrown so the route error page handles it.
 */
export async function getAlumnusProfile(id: string) {
  'use cache';
  cacheLife('hours');
  try {
    return await getApiClient().getAlumnus(id);
  } catch (error) {
    if (isApiError(error) && error.code === 'not_found') return null;
    throw error;
  }
}
