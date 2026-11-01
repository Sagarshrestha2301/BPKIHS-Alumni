import { describe, expect, it } from 'vitest';

import {
  CLOSE_SOON_DAYS,
  goalAverageGiftMinor,
  goalDaysLeft,
  goalPercentRaised,
  goalRemainingMinor,
  goalStatus,
  goalTimeLeft,
} from './goal-summary';

const now = new Date('2026-10-31T09:00:00.000Z');

describe('goal summary helpers', () => {
  it('floors the remaining amount at zero when a goal overshoots', () => {
    expect(goalRemainingMinor({ raisedMinor: 1_200_000, targetMinor: 1_000_000 })).toBe(0);
    expect(goalRemainingMinor({ raisedMinor: 400_000, targetMinor: 1_000_000 })).toBe(600_000);
    expect(goalRemainingMinor({ raisedMinor: 0, targetMinor: 0 })).toBe(0);
  });

  it('caps the percent at 100 and needs a target', () => {
    expect(goalPercentRaised({ raisedMinor: 1_200_000, targetMinor: 1_000_000 })).toBe(100);
    expect(goalPercentRaised({ raisedMinor: 500_000, targetMinor: 1_000_000 })).toBe(50);
    expect(goalPercentRaised({ raisedMinor: 500_000, targetMinor: 0 })).toBe(0);
  });

  it('measures whole days to the deadline without hour flicker', () => {
    // Deadline at 15:00Z tomorrow; at 09:00Z today that is 30 hours and still "1 day".
    const deadline = '2026-11-01T15:00:00.000Z';
    expect(goalDaysLeft(deadline, now)).toBe(1);
  });

  it('gives the status its priority: reached first, then ended, closing and open', () => {
    const base = { raisedMinor: 500_000, targetMinor: 1_000_000 };
    // Reached, even with a passed deadline.
    expect(
      goalStatus({ ...base, raisedMinor: 1_000_000, deadline: '2026-10-01T00:00:00.000Z' }, now),
    ).toBe('reached');
    // Ended once the deadline has passed without the target.
    expect(goalStatus({ ...base, deadline: '2026-10-01T00:00:00.000Z' }, now)).toBe('ended');
    // Closing inside the window, inclusive on the boundary day.
    const inside = new Date(`2026-10-31T09:00:00.000Z`);
    const soonDeadline = new Date(inside.getTime() + CLOSE_SOON_DAYS * 86_400_000).toISOString();
    expect(goalStatus({ ...base, deadline: soonDeadline }, now)).toBe('closing');
    // Open otherwise, with or without a deadline.
    expect(goalStatus({ ...base, deadline: '2027-06-01T00:00:00.000Z' }, now)).toBe('open');
    expect(goalStatus({ ...base }, now)).toBe('open');
  });

  it('phrases the countdown in days under two months, months afterwards', () => {
    expect(goalTimeLeft('2026-10-31T18:00:00.000Z', now)).toEqual({ kind: 'today', count: 0 });
    expect(goalTimeLeft('2026-11-01T08:00:00.000Z', now)).toEqual({ kind: 'tomorrow', count: 1 });
    expect(goalTimeLeft('2026-12-15T00:00:00.000Z', now)).toEqual({ kind: 'days', count: 45 });
    expect(goalTimeLeft('2027-06-01T00:00:00.000Z', now)).toEqual({ kind: 'months', count: 7 });
  });

  it('averages only over recorded gifts', () => {
    expect(goalAverageGiftMinor({ raisedMinor: 900_000 }, 3)).toBe(300_000);
    expect(goalAverageGiftMinor({ raisedMinor: 900_000 }, 0)).toBe(0);
  });
});
