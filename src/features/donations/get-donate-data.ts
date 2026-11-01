import { cacheLife } from 'next/cache';

import type { GoalUpdate } from '@/lib/api/types';
import { getServerApiClient } from '@/server/api/server-client';
import { getSiteStats } from '@/server/services/content';
import { getGivingStats, type GivingStats, listGoalUpdates } from '@/server/services/donations';

/**
 * The current time, approved for prerendering.
 *
 * `goalStatus` and the countdown words need a clock, but `new Date()` in a server component
 * blocks prerender (Cache Components refuses an unstable value). Reading it *inside* a cached
 * scope is the sanctioned alternative: the value is evaluated once per cache fill, and a
 * minute-stale clock is finer than the day-granularity countdown it feeds.
 */
export async function getCachedNow(): Promise<Date> {
  'use cache';
  cacheLife('minutes');
  return new Date();
}

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

/**
 * Gift counts and latest-gift dates per goal, plus the confirmed totals. Minutes last, like
 * the other money-adjacent reads, so a new gift shows on a goal card without a redeploy.
 */
export async function getGoalStats(): Promise<GivingStats> {
  'use cache';
  cacheLife('minutes');
  return getGivingStats();
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

export async function getRecentDonors(params?: { goalId?: string }) {
  'use cache';
  cacheLife('minutes');
  return getServerApiClient().listPublicDonors(params);
}

/**
 * Per-goal gift aggregates keyed by goal id, for the goal cards: one cached read feeds many
 * cards without each card doing its own query.
 */
export async function getGoalGiftStats(): Promise<
  Record<string, { gifts: number; latestGiftAt: string | null }>
> {
  'use cache';
  cacheLife('minutes');
  const stats = await getGoalStats();
  return Object.fromEntries(
    stats.perGoal.map((item) => [
      item.goalId,
      { gifts: item.gifts, latestGiftAt: item.latestGiftAt },
    ]),
  );
}

/**
 * The Association's progress updates for one goal, newest first. They are admin-published
 * narrative, so minutes of staleness after an editor hits save is the honest compromise
 * between freshness and not recomputing the page on every visit.
 */
export async function getGoalUpdates(goalId: string): Promise<GoalUpdate[]> {
  'use cache';
  cacheLife('minutes');
  return listGoalUpdates(goalId);
}

export async function getGoalById(id: string | undefined) {
  'use cache';
  cacheLife('hours');
  const goals = await getServerApiClient().listGoals();
  return goals.find((goal) => goal.id === id) ?? goals[0];
}

/**
 * The exact goal or nothing, for route pages: unlike `getGoalById` this never falls back
 * to the first goal, so an unknown id can 404 instead of showing the wrong cause.
 */
export async function getGoalExactly(id: string | undefined) {
  'use cache';
  cacheLife('hours');
  if (!id) return null;
  const goals = await getServerApiClient().listGoals();
  return goals.find((goal) => goal.id === id) ?? null;
}
