import type { ListParams, Paginated } from './types';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

/** Lower-case, accent-free and single-spaced, so "Zoë  Karki" matches "zoe karki". */
export function normaliseText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** True when every word of the query appears somewhere in the given fields. Empty query matches. */
export function matchesQuery(fields: ReadonlyArray<string | undefined>, query?: string): boolean {
  const terms = normaliseText(query ?? '')
    .split(' ')
    .filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normaliseText(fields.filter(Boolean).join(' '));
  return terms.every((term) => haystack.includes(term));
}

/** Whole numbers only; anything else falls back to the defaults. */
export function resolvePaging(params: ListParams = {}): { page: number; pageSize: number } {
  const page =
    Number.isFinite(params.page) && (params.page as number) >= 1
      ? Math.floor(params.page as number)
      : 1;
  const rawSize = params.pageSize;
  const pageSize =
    Number.isFinite(rawSize) && (rawSize as number) >= 1
      ? Math.min(Math.floor(rawSize as number), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

/** A page past the end returns no items and echoes the requested page, like a real API. */
export function paginate<T>(items: readonly T[], params: ListParams = {}): Paginated<T> {
  const { page, pageSize } = resolvePaging(params);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

export type Comparator<T> = (a: T, b: T) => number;

/** Compare by a string (accent- and case-insensitive) or number key. */
export function by<T>(
  key: (item: T) => string | number,
  direction: 'asc' | 'desc' = 'asc',
): Comparator<T> {
  const sign = direction === 'asc' ? 1 : -1;
  return (a, b) => {
    const x = key(a);
    const y = key(b);
    const result =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), 'en', { sensitivity: 'base' });
    return result * sign;
  };
}

/** Returns a sorted copy. Later comparators break ties; the input is never changed. */
export function sortBy<T>(items: readonly T[], ...comparators: Comparator<T>[]): T[] {
  return [...items].sort((a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
}
