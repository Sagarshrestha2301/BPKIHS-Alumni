import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { directoryPage } from '@/content/directory';
import type { DirectoryParams } from '@/features/directory/parse-directory-params';
import type { AlumniFilterOptions } from '@/lib/api/types';
import { PROGRAMMES } from '@/lib/constants/domain';

type DirectoryFilterFormProps = {
  params: DirectoryParams;
  options: AlumniFilterOptions;
  /** Keeps ids unique when the form appears twice (sidebar and mobile sheet). */
  idPrefix: string;
};

const selectClass =
  'h-11 w-full rounded-lg border border-neutral-300/90 bg-white px-3 text-base shadow-xs focus-visible:border-primary-700 focus-visible:ring-4 focus-visible:ring-primary-700/15 outline-none transition-all duration-180 ease-out';

/** The menu does not list a value from the URL unless we add it, so it is never lost silently. */
function withCurrent<T extends string | number>(list: T[], current: T | undefined): T[] {
  return current !== undefined && !list.includes(current) ? [...list, current] : list;
}

/** A plain GET form. The search text and the sort travel along as hidden fields. */
export function DirectoryFilterForm({ params, options, idPrefix }: DirectoryFilterFormProps) {
  const copy = directoryPage.filters;
  const id = (name: string) => idPrefix + '-' + name;
  const countries = withCurrent(options.countries, params.country);
  const batchYears = withCurrent(options.batchYears, params.batchYear).sort((a, b) => b - a);

  return (
    <form action="/directory" method="get" aria-label={copy.formLabel} className="grid gap-5">
      {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
      {params.sort !== 'name' ? <input type="hidden" name="sort" value={params.sort} /> : null}

      <div>
        <Label htmlFor={id('programme')} className="text-primary-900 mb-2 block font-medium">
          {copy.programme.label}
        </Label>
        <select
          id={id('programme')}
          name="programme"
          defaultValue={params.programme ?? ''}
          className={selectClass}
        >
          <option value="">{copy.programme.any}</option>
          {PROGRAMMES.map((programme) => (
            <option key={programme} value={programme}>
              {programme}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor={id('batch')} className="text-primary-900 mb-2 block font-medium">
          {copy.batch.label}
        </Label>
        <select
          id={id('batch')}
          name="batch"
          defaultValue={params.batchYear ? String(params.batchYear) : ''}
          className={selectClass}
        >
          <option value="">{copy.batch.any}</option>
          {batchYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor={id('country')} className="text-primary-900 mb-2 block font-medium">
          {copy.country.label}
        </Label>
        <select
          id={id('country')}
          name="country"
          defaultValue={params.country ?? ''}
          className={selectClass}
        >
          <option value="">{copy.country.any}</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor={id('city')} className="text-primary-900 mb-2 block font-medium">
          {copy.city.label}
        </Label>
        <Input
          id={id('city')}
          name="city"
          type="text"
          defaultValue={params.city ?? ''}
          placeholder={copy.city.placeholder}
          maxLength={100}
          className="h-11 bg-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id={id('further')}
          name="further"
          type="checkbox"
          value="1"
          defaultChecked={params.furtherStudies === true}
          className="accent-primary-700 size-5"
        />
        <Label htmlFor={id('further')} className="text-primary-900 text-base font-medium">
          {copy.further}
        </Label>
      </div>

      <Button type="submit" className="h-11">
        {copy.apply}
      </Button>
    </form>
  );
}
