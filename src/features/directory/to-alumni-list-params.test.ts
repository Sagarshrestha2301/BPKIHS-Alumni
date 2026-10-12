import { describe, expect, it } from 'vitest';

import { toAlumniListParams } from '@/features/directory/to-alumni-list-params';

describe('toAlumniListParams', () => {
  it('sends only sort, page and page size when nothing is filtered', () => {
    expect(toAlumniListParams({ sort: 'name', page: 1 })).toEqual({
      sort: 'name',
      page: 1,
      pageSize: 12,
    });
  });

  it('passes every filter and the search text through', () => {
    expect(
      toAlumniListParams({
        q: 'rai',
        sort: 'batch_oldest',
        page: 3,
        programme: 'MBBS',
        batchYear: 2005,
        country: 'Nepal',
        city: 'Pokhara',
        furtherStudies: true,
      }),
    ).toEqual({
      q: 'rai',
      sort: 'batch_oldest',
      page: 3,
      pageSize: 12,
      programme: 'MBBS',
      batchYear: 2005,
      country: 'Nepal',
      city: 'Pokhara',
      furtherStudies: true,
    });
  });
});
