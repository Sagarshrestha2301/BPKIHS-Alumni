import { DirectoryResultsView } from '@/features/directory/directory-results-view';
import { DirectorySearchForm } from '@/features/directory/directory-search-form';
import { getAlumniPage } from '@/features/directory/get-directory-data';
import {
  DIRECTORY_PAGE_SIZE,
  parseDirectoryParams,
  type RawSearchParams,
} from '@/features/directory/parse-directory-params';

/** Reads the URL query, fetches that page of alumni, and renders the form and results. */
export async function DirectoryContent({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseDirectoryParams(await searchParams);
  const result = await getAlumniPage({
    ...(params.q ? { q: params.q } : {}),
    sort: params.sort,
    page: params.page,
    pageSize: DIRECTORY_PAGE_SIZE,
  });

  return (
    <>
      <DirectorySearchForm q={params.q} sort={params.sort} />
      <DirectoryResultsView result={result} params={params} />
    </>
  );
}
