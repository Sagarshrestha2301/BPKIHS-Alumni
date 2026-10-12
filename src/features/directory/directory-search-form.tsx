import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { directoryPage } from '@/content/directory';
import { ALUMNI_SORTS, type DirectoryFilters } from '@/features/directory/parse-directory-params';
import type { AlumniSort } from '@/lib/api/types';

type DirectorySearchFormProps = {
  q?: string | undefined;
  sort: AlumniSort;
  filters?: DirectoryFilters;
};

/** A plain GET form: the URL holds the state, so it works without JavaScript. */
export function DirectorySearchForm({ q, sort, filters }: DirectorySearchFormProps) {
  const { search, sort: sortCopy } = directoryPage;

  return (
    <form action="/directory" method="get" role="search" aria-label={search.formLabel}>
      {filters?.programme ? (
        <input type="hidden" name="programme" value={filters.programme} />
      ) : null}
      {filters?.batchYear ? <input type="hidden" name="batch" value={filters.batchYear} /> : null}
      {filters?.country ? <input type="hidden" name="country" value={filters.country} /> : null}
      {filters?.city ? <input type="hidden" name="city" value={filters.city} /> : null}
      {filters?.furtherStudies ? <input type="hidden" name="further" value="1" /> : null}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div>
          <Label htmlFor="directory-q" className="text-primary-900 mb-2 block font-medium">
            {search.label}
          </Label>
          <Input
            id="directory-q"
            name="q"
            type="search"
            defaultValue={q ?? ''}
            placeholder={search.placeholder}
            className="h-11 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="directory-sort" className="text-primary-900 mb-2 block font-medium">
            {sortCopy.label}
          </Label>
          <select
            id="directory-sort"
            name="sort"
            defaultValue={sort}
            className="h-11 w-full rounded-lg border border-neutral-500 bg-white px-3 text-base"
          >
            {ALUMNI_SORTS.map((option) => (
              <option key={option} value={option}>
                {sortCopy.options[option]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-11 px-6">
          {search.button}
        </Button>
      </div>
    </form>
  );
}
