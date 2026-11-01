import type { DonationGoal } from '@/lib/api/types';

/**
 * Goal-status and headline-number reasoning for the goal cards and the goal detail page.
 *
 * Deliberately pure and free of server imports: pages compose these with content copy, and
 * the unit tests pin the status priority without a database.
 */

export type GoalStatusKey = 'reached' | 'ended' | 'closing' | 'open';

/** How many days before the deadline a goal is announced as closing soon. */
export const CLOSE_SOON_DAYS = 14;

/** Paisa still needed, floored at zero: a goal can overshoot its target. */
export function goalRemainingMinor(
  goal: Pick<DonationGoal, 'raisedMinor' | 'targetMinor'>,
): number {
  if (!goal.targetMinor) return 0;
  return Math.max(0, goal.targetMinor - goal.raisedMinor);
}

export function goalPercentRaised(goal: Pick<DonationGoal, 'raisedMinor' | 'targetMinor'>): number {
  if (!goal.targetMinor) return 0;
  return Math.min(100, Math.round((goal.raisedMinor / goal.targetMinor) * 100));
}

/**
 * Whole days between now and the deadline, rounded rather than ceiled: a deadline 9 hours
 * away is still "today" and 26 hours is still "1 day", so a closing day never flickers with
 * the hour of the day. Past dates round toward zero too, so `goalStatus` checks the clock
 * itself instead of trusting this number near the boundary.
 */
export function goalDaysLeft(deadline: string, now: Date): number {
  const hours = (new Date(deadline).getTime() - now.getTime()) / 3_600_000;
  if (Number.isNaN(hours)) return -1;
  return Math.round(hours / 24);
}

/**
 * The status, in priority order. Reaching the target outranks everything; a passed deadline
 * closes the goal even when the target has not been met; the closing-soon window is
 * CLOSE_SOON_DAYS. A goal without a deadline stays open until the Association marks it done.
 */
export function goalStatus(
  goal: Pick<DonationGoal, 'raisedMinor' | 'targetMinor' | 'deadline'>,
  now: Date = new Date(),
): GoalStatusKey {
  if (goal.targetMinor > 0 && goal.raisedMinor >= goal.targetMinor) return 'reached';
  if (goal.deadline) {
    const at = new Date(goal.deadline).getTime();
    // A passed deadline closes the goal even in the hours before `goalDaysLeft` rounds to a
    // negative day: 0 days past is still past, not "closing soon".
    if (!Number.isNaN(at) && at < now.getTime()) return 'ended';
    if (goalDaysLeft(goal.deadline, now) <= CLOSE_SOON_DAYS) return 'closing';
  }
  return 'open';
}

/** Structured phrasing materials for the countdown; the words live in the content file. */
export type GoalTimeLeft =
  | { kind: 'today' | 'tomorrow'; count: 0 | 1 }
  | {
      kind: 'days' | 'months';
      count: number;
    };

export function goalTimeLeft(deadline: string, now: Date = new Date()): GoalTimeLeft {
  const days = goalDaysLeft(deadline, now);
  if (days <= 0) return { kind: 'today', count: 0 };
  if (days === 1) return { kind: 'tomorrow', count: 1 };
  if (days <= 60) return { kind: 'days', count: days };
  return { kind: 'months', count: Math.max(2, Math.round(days / 30)) };
}

/** The average confirmed gift, in paisa; zero while there are no gifts to average. */
export function goalAverageGiftMinor(
  goal: Pick<DonationGoal, 'raisedMinor'>,
  gifts: number,
): number {
  if (gifts <= 0) return 0;
  return Math.round(goal.raisedMinor / gifts);
}
