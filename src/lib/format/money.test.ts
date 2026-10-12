import { describe, expect, it } from 'vitest';

import { formatNpr, formatNprCompact, rupees } from './money';

describe('formatNpr', () => {
  it('formats whole rupees with grouping', () => {
    expect(formatNpr(500_000)).toBe('NPR 5,000');
    expect(formatNpr(12_345_600)).toBe('NPR 123,456');
    expect(formatNpr(0)).toBe('NPR 0');
  });

  it('shows paisa only when they are not zero', () => {
    expect(formatNpr(10_050)).toBe('NPR 100.50');
    expect(formatNpr(150)).toBe('NPR 1.50');
    expect(formatNpr(5)).toBe('NPR 0.05');
  });

  it('keeps the sign on negative amounts', () => {
    expect(formatNpr(-500_000)).toBe('-NPR 5,000');
  });

  it('rejects values that are not numbers', () => {
    expect(() => formatNpr(Number.NaN)).toThrow(RangeError);
    expect(() => formatNpr(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('formatNprCompact', () => {
  it('shows the exact amount below NPR 100,000', () => {
    expect(formatNprCompact(rupees(4_200))).toBe('NPR 4,200');
    expect(formatNprCompact(rupees(99_999))).toBe('NPR 99,999');
  });

  it('uses K, M and B above that', () => {
    expect(formatNprCompact(rupees(420_000))).toBe('NPR 420K');
    expect(formatNprCompact(rupees(4_200_000))).toBe('NPR 4.2M');
    expect(formatNprCompact(rupees(1_300_000))).toBe('NPR 1.3M');
    expect(formatNprCompact(rupees(2_000_000))).toBe('NPR 2M');
    expect(formatNprCompact(rupees(1_500_000_000))).toBe('NPR 1.5B');
  });

  it('rolls over at the boundaries instead of printing 1000K', () => {
    expect(formatNprCompact(rupees(999_950))).toBe('NPR 1M');
    expect(formatNprCompact(rupees(1_000_000))).toBe('NPR 1M');
  });
});

describe('rupees', () => {
  it('converts rupees to paisa', () => {
    expect(rupees(5_000)).toBe(500_000);
    expect(rupees(0.5)).toBe(50);
  });
});
