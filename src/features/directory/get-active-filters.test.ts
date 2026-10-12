import { describe, expect, it } from 'vitest';

import { getActiveFilters, getClearFiltersHref } from '@/features/directory/get-active-filters';

describe('getActiveFilters', () => {
  it('returns nothing when no filter is set', () => {
    expect(getActiveFilters({ sort: 'name', page: 1 })).toEqual([]);
  });

  it('makes one chip per filter, in a fixed order, each removing only itself', () => {
    const chips = getActiveFilters({
      q: 'rai',
      sort: 'batch_newest',
      page: 4,
      programme: 'BMIT',
      batchYear: 2018,
      country: 'Nepal',
      city: 'Dharan',
      furtherStudies: true,
    });
    expect(chips.map((chip) => chip.label)).toEqual([
      'BMIT',
      'Batch 2018',
      'Nepal',
      'City: Dharan',
      'Further studies',
    ]);
    expect(chips[0]?.href).toBe(
      '/directory?q=rai&batch=2018&country=Nepal&city=Dharan&further=1&sort=batch_newest',
    );
    expect(chips[4]?.href).toBe(
      '/directory?q=rai&programme=BMIT&batch=2018&country=Nepal&city=Dharan&sort=batch_newest',
    );
  });

  it('goes back to page 1 when a filter is removed', () => {
    const chips = getActiveFilters({ sort: 'name', page: 3, programme: 'MBBS' });
    expect(chips[0]?.href).toBe('/directory');
  });
});

describe('getClearFiltersHref', () => {
  it('keeps the search text and the sort and drops the filters and the page', () => {
    expect(
      getClearFiltersHref({
        q: 'rai',
        sort: 'batch_newest',
        page: 2,
        programme: 'MBBS',
        furtherStudies: true,
      }),
    ).toBe('/directory?q=rai&sort=batch_newest');
  });

  it('is just /directory when nothing else is set', () => {
    expect(getClearFiltersHref({ sort: 'name', page: 5, country: 'Nepal' })).toBe('/directory');
  });
});
