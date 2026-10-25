import { cacheLife } from 'next/cache';

import { getServerApiClient } from '@/server/api/server-client';

export async function getFaqItems() {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().listFaq();
}
