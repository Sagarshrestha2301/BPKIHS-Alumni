/**
 * Dates are ISO 8601 strings and are shown in Nepal time (UTC+5:45), like 12 Oct 2026.
 * Month names are fixed, so every browser prints "Sep" and never "Sept".
 */

export const NEPAL_TIME_ZONE = 'Asia/Kathmandu';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NEPAL_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function toParts(iso: string): Parts {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) throw new RangeError(`Invalid date: ${iso}`);
  const found = new Map<string, string>();
  for (const part of formatter.formatToParts(new Date(time))) found.set(part.type, part.value);
  const read = (type: string) => Number(found.get(type));
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour') % 24,
    minute: read('minute'),
  };
}

function dateText(p: Parts): string {
  return `${p.day} ${MONTHS[p.month - 1] ?? ''} ${p.year}`;
}

function timeText(p: Parts): string {
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const suffix = p.hour < 12 ? 'AM' : 'PM';
  return `${hour12}:${String(p.minute).padStart(2, '0')} ${suffix}`;
}

/** 12 Oct 2026 */
export function formatDate(iso: string): string {
  return dateText(toParts(iso));
}

/** 5:45 PM */
export function formatTime(iso: string): string {
  return timeText(toParts(iso));
}

/** 12 Oct 2026, 5:45 PM */
export function formatDateTime(iso: string): string {
  const p = toParts(iso);
  return `${dateText(p)}, ${timeText(p)}`;
}

/**
 * Event times. Same day: "12 Oct 2026, 5:45 PM to 7:30 PM".
 * Different days: "12 Oct 2026, 5:45 PM to 14 Oct 2026, 1:00 PM". No end: the start only.
 */
export function formatDateRange(startIso: string, endIso?: string): string {
  const start = toParts(startIso);
  if (!endIso) return `${dateText(start)}, ${timeText(start)}`;
  const end = toParts(endIso);
  const sameDay = start.year === end.year && start.month === end.month && start.day === end.day;
  if (sameDay) return `${dateText(start)}, ${timeText(start)} to ${timeText(end)}`;
  return `${dateText(start)}, ${timeText(start)} to ${dateText(end)}, ${timeText(end)}`;
}
