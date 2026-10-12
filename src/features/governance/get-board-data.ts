import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';

/** Current and previous boards. Same for every visitor, so they are cached. */
export async function getBoards() {
  'use cache';
  cacheLife('days');
  const api = getApiClient();
  const [current, previous] = await Promise.all([
    api.listBoard({ current: true }),
    api.listBoard({ current: false }),
  ]);
  return { current, previous };
}
