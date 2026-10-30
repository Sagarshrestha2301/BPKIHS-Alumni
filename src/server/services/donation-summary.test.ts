import { describe, expect, it } from 'vitest';

import { buildGivingMonths } from './donation-summary';

describe('buildGivingMonths', () => {
  it('returns the current month and the five before it, in order', () => {
    const months = buildGivingMonths([], new Date('2026-10-28T06:00:00.000Z'));

    expect(months.map((month) => month.key)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(months.every((month) => month.raisedMinor === 0 && month.gifts === 0)).toBe(true);
  });

  it('matches database rows to their month and leaves the rest at zero', () => {
    const months = buildGivingMonths(
      [
        { key: '2026-10', raisedMinor: '250000', gifts: 2 },
        { key: '2026-08', raisedMinor: 100_000, gifts: 1 },
        // Outside the window: must not create a seventh bar.
        { key: '2026-04', raisedMinor: 900_000, gifts: 9 },
      ],
      new Date('2026-10-28T06:00:00.000Z'),
    );

    expect(months).toHaveLength(6);
    expect(months.find((month) => month.key === '2026-10')).toMatchObject({
      raisedMinor: 250_000,
      gifts: 2,
    });
    expect(months.find((month) => month.key === '2026-08')).toMatchObject({
      raisedMinor: 100_000,
      gifts: 1,
    });
    expect(months.find((month) => month.key === '2026-07')).toMatchObject({
      raisedMinor: 0,
      gifts: 0,
    });
    expect(months.some((month) => month.key === '2026-04')).toBe(false);
  });

  it('crosses a year boundary correctly', () => {
    const months = buildGivingMonths([], new Date('2027-02-10T06:00:00.000Z'));

    expect(months.map((month) => month.key)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });
});
