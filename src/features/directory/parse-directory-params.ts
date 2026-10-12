import type { AlumniSort } from '@/lib/api/types';

export const ALUMNI_SORTS = [
  'name',
  'batch_newest',
  'batch_oldest',
  'recently_joined',
] as const satisfies readonly AlumniSort[];

export const DIRECTORY_PAGE_SIZE = 12;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type DirectoryParams = { q?: string; sort: AlumniSort; page: number };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Turns the raw URL query into safe values. Anything invalid falls back to a default. */
export function parseDirectoryParams(raw: RawSearchParams): DirectoryParams {
  const q = first(raw.q)?.trim().slice(0, 100);
  const sortValue = first(raw.sort);
  const sort = ALUMNI_SORTS.find((option) => option === sortValue) ?? 'name';
  const pageNumber = Number.parseInt(first(raw.page) ?? '', 10);
  const page = Number.isInteger(pageNumber) && pageNumber >= 1 ? Math.min(pageNumber, 1000) : 1;
  return q ? { q, sort, page } : { sort, page };
}
