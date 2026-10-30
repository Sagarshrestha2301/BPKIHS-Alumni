import { config } from '../config';

export interface GivingMonthRow {
  key: string;
  raisedMinor: string | number;
  gifts: number;
}

export interface AdminGivingMonth {
  key: string;
  label: string;
  raisedMinor: number;
  gifts: number;
}

export interface MonthWindowItem {
  key: string;
  label: string;
}

/** The current local calendar month and the five before it, oldest first. */
export function buildMonthWindow(now: Date): MonthWindowItem[] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 6 + index, 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      label: monthLabel.format(date),
    };
  });
}

/** Build exactly the current month and five previous local calendar months. */
export function buildGivingMonths(rows: readonly GivingMonthRow[], now: Date): AdminGivingMonth[] {
  const byMonth = new Map(rows.map((item) => [item.key, item]));

  return buildMonthWindow(now).map(({ key, label }) => {
    const row = byMonth.get(key);
    return {
      key,
      label,
      raisedMinor: Number(row?.raisedMinor ?? 0),
      gifts: Number(row?.gifts ?? 0),
    };
  });
}
