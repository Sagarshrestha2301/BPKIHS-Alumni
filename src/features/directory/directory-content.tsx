import { directoryPage } from '@/content/directory';
import { ActiveFilterChips } from '@/features/directory/active-filter-chips';
import { DirectoryFilterForm } from '@/features/directory/directory-filter-form';
import { DirectoryResultsView } from '@/features/directory/directory-results-view';
import { DirectorySearchForm } from '@/features/directory/directory-search-form';
import { getActiveFilters } from '@/features/directory/get-active-filters';
import { getAlumniPage } from '@/features/directory/get-directory-data';
import { getAlumniFilterOptions } from '@/features/directory/get-filter-options';
import { MobileFiltersSheet } from '@/features/directory/mobile-filters-sheet';
import {
  parseDirectoryParams,
  type RawSearchParams,
} from '@/features/directory/parse-directory-params';
import { toAlumniListParams } from '@/features/directory/to-alumni-list-params';

/** Reads the URL query, fetches that page of alumni, and renders the filters and results. */
export async function DirectoryContent({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseDirectoryParams(await searchParams);
  const [result, options] = await Promise.all([
    getAlumniPage(toAlumniListParams(params)),
    getAlumniFilterOptions(),
  ]);
  const activeCount = getActiveFilters(params).length;
  const copy = directoryPage.filters;

  return (
    <>
      <DirectorySearchForm q={params.q} sort={params.sort} filters={params} />

      <div className="mt-6 lg:hidden">
        <MobileFiltersSheet activeCount={activeCount}>
          <DirectoryFilterForm params={params} options={options} idPrefix="sheet" />
        </MobileFiltersSheet>
      </div>

      <div className="mt-2 grid gap-8 lg:mt-8 lg:grid-cols-[16rem_1fr]">
        <aside aria-label={copy.asideLabel} className="hidden lg:block">
          <h2 className="font-heading text-primary-900 mb-4 text-lg font-semibold">
            {copy.heading}
          </h2>
          <DirectoryFilterForm params={params} options={options} idPrefix="side" />
        </aside>
        <div className="min-w-0 lg:-mt-8">
          <ActiveFilterChips params={params} />
          <DirectoryResultsView result={result} params={params} />
        </div>
      </div>
    </>
  );
}
