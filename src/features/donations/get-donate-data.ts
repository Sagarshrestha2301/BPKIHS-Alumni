import { cacheLife } from 'next/cache';

import { getServerApiClient } from '@/server/api/server-client';

/** The general fund first, then named goals. */
export async function getDonationGoals() {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().listGoals();
}

export async function getFundsBreakdown() {
  'use cache';
  cacheLife('hours');
  return getServerApiClient().getFundsBreakdown();
}

export async function getGoalById(id: string | undefined) {
  'use cache';
  cacheLife('hours');
  const goals = await getServerApiClient().listGoals();
  return goals.find((goal) => goal.id === id) ?? goals[0];
}
