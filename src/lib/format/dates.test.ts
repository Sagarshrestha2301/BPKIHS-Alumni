import { describe, expect, it } from 'vitest';

import { formatDate, formatDateRange, formatDateTime, formatTime } from './dates';

describe('date formatting (Nepal time)', () => {
  it('formats a date like 12 Oct 2026', () => {
    expect(formatDate('2026-10-12T12:00:00Z')).toBe('12 Oct 2026');
  });

  it('always prints Sep, never Sept', () => {
    expect(formatDate('2026-09-05T06:00:00Z')).toBe('5 Sep 2026');
  });

  it('uses the Nepal day, which can differ from the UTC day', () => {
    // 20:00 UTC on 12 Oct is 01:45 on 13 Oct in Nepal.
    expect(formatDate('2026-10-12T20:00:00Z')).toBe('13 Oct 2026');
    expect(formatTime('2026-10-12T20:00:00Z')).toBe('1:45 AM');
  });

  it('formats the time with AM and PM', () => {
    expect(formatTime('2026-10-12T12:00:00Z')).toBe('5:45 PM');
    expect(formatTime('2026-10-12T06:15:00Z')).toBe('12:00 PM');
    expect(formatTime('2026-10-11T18:15:00Z')).toBe('12:00 AM');
  });

  it('formats date and time together', () => {
    expect(formatDateTime('2026-10-12T12:00:00Z')).toBe('12 Oct 2026, 5:45 PM');
  });

  it('rejects text that is not a date', () => {
    expect(() => formatDate('not a date')).toThrow(RangeError);
  });
});

describe('formatDateRange', () => {
  it('shows only the start when there is no end', () => {
    expect(formatDateRange('2026-10-12T12:00:00Z')).toBe('12 Oct 2026, 5:45 PM');
  });

  it('shares the date when both times fall on the same day', () => {
    expect(formatDateRange('2026-10-12T12:00:00Z', '2026-10-12T14:00:00Z')).toBe(
      '12 Oct 2026, 5:45 PM to 7:45 PM',
    );
  });

  it('shows both dates for a multi-day event', () => {
    expect(formatDateRange('2026-10-12T12:00:00Z', '2026-10-14T08:00:00Z')).toBe(
      '12 Oct 2026, 5:45 PM to 14 Oct 2026, 1:45 PM',
    );
  });
});
