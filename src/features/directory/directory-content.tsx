import { DirectoryResultsView } from '@/features/directory/directory-results-view';
import { DirectorySearchForm } from '@/features/directory/directory-search-form';
import { getAlumniPage } from '@/features/directory/get-directory-data';
import {
  parseDirectoryParams,
  type RawSearchParams,
} from '@/features/directory/parse-directory-params';
import { toAlumniListParams } from '@/features/directory/to-alumni-list-params';

/** Reads the URL query, fetches that page of alumni, and renders the form and results. */
export async function DirectoryContent({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseDirectoryParams(await searchParams);
  const result = await getAlumniPage(toAlumniListParams(params));

  return (
    <>
      <DirectorySearchForm q={params.q} sort={params.sort} />
      <DirectoryResultsView result={result} params={params} />
    </>
  );
}
