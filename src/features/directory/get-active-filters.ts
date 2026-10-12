import { directoryPage } from '@/content/directory';
import { buildDirectoryHref } from '@/features/directory/build-directory-href';
import type {
  DirectoryFilters,
  DirectoryParams,
} from '@/features/directory/parse-directory-params';

export type ActiveFilter = { key: keyof DirectoryFilters; label: string; href: string };

/** The URL for the current state with one filter removed. Goes back to page 1. */
function hrefWithout(params: DirectoryParams, key: keyof DirectoryFilters): string {
  const next: DirectoryParams = { ...params, page: 1 };
  delete (next as DirectoryFilters)[key];
  return buildDirectoryHref(next);
}

/** One chip per filter that is set, each linking to the same view without that filter. */
export function getActiveFilters(params: DirectoryParams): ActiveFilter[] {
  const { chips } = directoryPage.filters;
  const items: ActiveFilter[] = [];
  if (params.programme) {
    items.push({
      key: 'programme',
      label: params.programme,
      href: hrefWithout(params, 'programme'),
    });
  }
  if (params.batchYear) {
    items.push({
      key: 'batchYear',
      label: chips.batch + ' ' + params.batchYear,
      href: hrefWithout(params, 'batchYear'),
    });
  }
  if (params.country) {
    items.push({ key: 'country', label: params.country, href: hrefWithout(params, 'country') });
  }
  if (params.city) {
    items.push({
      key: 'city',
      label: chips.city + ': ' + params.city,
      href: hrefWithout(params, 'city'),
    });
  }
  if (params.furtherStudies) {
    items.push({
      key: 'furtherStudies',
      label: chips.further,
      href: hrefWithout(params, 'furtherStudies'),
    });
  }
  return items;
}

/** The URL with every filter cleared. The search text and the sort are kept. */
export function getClearFiltersHref(params: DirectoryParams): string {
  return buildDirectoryHref({
    ...(params.q ? { q: params.q } : {}),
    sort: params.sort,
    page: 1,
  });
}
