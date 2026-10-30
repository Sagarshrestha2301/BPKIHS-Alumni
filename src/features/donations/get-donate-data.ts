import { cacheLife } from 'next/cache';

import { getServerApiClient } from '@/server/api/server-client';
import { getSiteStats } from '@/server/services/content';

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

/** Confirmed gifts for the transparency page; short-lived because money moves daily. */
export async function getConfirmedGivingTotals() {
  'use cache';
  cacheLife('minutes');
  const [stats, goals] = await Promise.all([getSiteStats(), getDonationGoals()]);
  return {
    raisedMinor: stats.raisedMinor,
    activeGoals: goals.length,
  };
}

export async function getRecentDonors() {
  'use cache';
  cacheLife('minutes');
  return getServerApiClient().listPublicDonors();
}

export async function getGoalById(id: string | undefined) {
  'use cache';
  cacheLife('hours');
  const goals = await getServerApiClient().listGoals();
  return goals.find((goal) => goal.id === id) ?? goals[0];
}
