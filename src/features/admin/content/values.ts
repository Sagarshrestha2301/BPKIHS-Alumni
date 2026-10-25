import { SITE_TIME_ZONE, SITE_UTC_OFFSET } from '@/lib/constants/site';

export type FormValue = string | boolean | undefined;

const dateTimeFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** ISO instant to the `datetime-local` value shown in Nepal time. */
export function toDateTimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  return dateTimeFormatter.format(new Date(time)).replace(' ', 'T');
}

/** `datetime-local` value (Nepal time) to an ISO instant. */
export function fromDateTimeLocal(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = Date.parse(`${trimmed}:00${SITE_UTC_OFFSET}`);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

export function paisaToRupees(minor: number): string {
  return String(Math.round(minor) / 100);
}

export function rupeesToPaisa(value: string): number | undefined {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return undefined;
  return Math.round(amount * 100);
}

export function toJsonText(value: unknown): string {
  return value ? JSON.stringify(value, null, 2) : '';
}
