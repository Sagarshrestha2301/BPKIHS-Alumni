import { describe, expect, it } from 'vitest';

import { buildDirectoryHref } from '@/features/directory/build-directory-href';
import {
  type DirectoryParams,
  parseDirectoryParams,
} from '@/features/directory/parse-directory-params';

describe('buildDirectoryHref filters', () => {
  it('adds each filter that is set', () => {
    expect(
      buildDirectoryHref({
        sort: 'name',
        page: 1,
        programme: 'BMIT',
        batchYear: 2018,
        country: 'Nepal',
        city: 'Kathmandu',
        furtherStudies: true,
      }),
    ).toBe('/directory?programme=BMIT&batch=2018&country=Nepal&city=Kathmandu&further=1');
  });

  it('encodes spaces in a programme name', () => {
    expect(buildDirectoryHref({ sort: 'name', page: 1, programme: 'BSc Nursing' })).toBe(
      '/directory?programme=BSc+Nursing',
    );
  });

  it('survives a round trip through the URL', () => {
    const state: DirectoryParams = {
      q: 'dr rai',
      sort: 'batch_newest',
      page: 2,
      programme: 'MD/MS',
      batchYear: 2010,
      country: 'United States',
      city: 'Boston',
      furtherStudies: true,
    };
    const url = new URL('http://localhost' + buildDirectoryHref(state));
    expect(parseDirectoryParams(Object.fromEntries(url.searchParams))).toEqual(state);
  });
});
