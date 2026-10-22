import { cacheLife } from 'next/cache';

import { getApiClient } from '@/lib/api/client';

/** The general fund first, then named goals. */
export async function getDonationGoals() {
  'use cache';
  cacheLife('hours');
  return getApiClient().listGoals();
}

export async function getFundsBreakdown() {
  'use cache';
  cacheLife('hours');
  return getApiClient().getFundsBreakdown();
}

export async function getGoalById(id: string | undefined) {
  'use cache';
  cacheLife('hours');
  const goals = await getApiClient().listGoals();
  return goals.find((goal) => goal.id === id) ?? goals[0];
}
