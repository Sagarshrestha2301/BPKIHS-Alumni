import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';

export async function getCommunityPosts() {
  'use cache';
  cacheLife('hours');
  const page = await getApiClient().listFeed({ pageSize: 50 });
  return page.items;
}
