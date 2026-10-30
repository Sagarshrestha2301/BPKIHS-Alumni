import { cacheLife } from 'next/cache';

import { isApiError } from '@/lib/api/errors';
import type { FeedPost } from '@/lib/api/types';
import { getServerApiClient } from '@/server/api/server-client';

export async function getCommunityPosts() {
  'use cache';
  cacheLife('hours');
  const page = await getServerApiClient().listFeed({ pageSize: 50 });
  return page.items;
}

/**
 * One approved post, or null when it does not exist or is still under moderation.
 *
 * The cache boundary serialises what it returns and rethrows failures as plain `Error`s, so the
 * not-found case is a value rather than an exception; the caller decides to call `notFound()`.
 */
export async function getPostById(id: string): Promise<FeedPost | null> {
  'use cache';
  cacheLife('hours');
  try {
    return await getServerApiClient().getPost(id);
  } catch (error) {
    if (isApiError(error) && error.code === 'not_found') return null;
    throw error;
  }
}
