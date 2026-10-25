import type { AlumniSort } from '@/lib/api/types';
import { type Programme, PROGRAMMES } from '@/lib/constants/domain';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants/pagination';

export const ALUMNI_SORTS = [
  'name',
  'batch_newest',
  'batch_oldest',
  'recently_joined',
] as const satisfies readonly AlumniSort[];

export const DIRECTORY_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export const MIN_BATCH_YEAR = 1900;
export const MAX_BATCH_YEAR = 2100;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** The filter part of the directory state. Each value is present only when it is set. */
export type DirectoryFilters = {
  programme?: Programme;
  batchYear?: number;
  country?: string;
  city?: string;
  furtherStudies?: true;
};

export type DirectoryParams = DirectoryFilters & { q?: string; sort: AlumniSort; page: number };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: string | string[] | undefined, maxLength: number): string | undefined {
  const text = first(value)?.trim().slice(0, maxLength);
  return text ? text : undefined;
}

/** Turns the raw URL query into safe values. Anything invalid falls back to a default. */
export function parseDirectoryParams(raw: RawSearchParams): DirectoryParams {
  const q = cleanText(raw.q, 100);
  const sortValue = first(raw.sort);
  const sort = ALUMNI_SORTS.find((option) => option === sortValue) ?? 'name';
  const pageNumber = Number.parseInt(first(raw.page) ?? '', 10);
  const page = Number.isInteger(pageNumber) && pageNumber >= 1 ? Math.min(pageNumber, 1000) : 1;

  const programmeValue = first(raw.programme);
  const programme = PROGRAMMES.find((option) => option === programmeValue);
  const batchNumber = Number.parseInt(first(raw.batch) ?? '', 10);
  const batchYear =
    Number.isInteger(batchNumber) && batchNumber >= MIN_BATCH_YEAR && batchNumber <= MAX_BATCH_YEAR
      ? batchNumber
      : undefined;
  const country = cleanText(raw.country, 100);
  const city = cleanText(raw.city, 100);
  const furtherStudies = ['1', 'true'].includes(first(raw.further) ?? '');

  return {
    sort,
    page,
    ...(q ? { q } : {}),
    ...(programme ? { programme } : {}),
    ...(batchYear ? { batchYear } : {}),
    ...(country ? { country } : {}),
    ...(city ? { city } : {}),
    ...(furtherStudies ? { furtherStudies: true as const } : {}),
  };
}
