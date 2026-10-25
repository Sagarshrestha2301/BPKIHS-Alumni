import { cacheLife } from 'next/cache';

import { getServerApiClient } from '@/server/api/server-client';

export async function getCommunityPosts() {
  'use cache';
  cacheLife('hours');
  const page = await getServerApiClient().listFeed({ pageSize: 50 });
  return page.items;
}
