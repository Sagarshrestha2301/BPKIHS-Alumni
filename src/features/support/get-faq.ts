import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';

export async function getFaqItems() {
  'use cache';
  cacheLife('hours');
  return getApiClient().listFaq();
}
