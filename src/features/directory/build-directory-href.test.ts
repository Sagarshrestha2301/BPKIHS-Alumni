import { describe, expect, it } from 'vitest';

import { buildDirectoryHref } from '@/features/directory/build-directory-href';

describe('buildDirectoryHref', () => {
  it('is just /directory for the defaults', () => {
    expect(buildDirectoryHref({ sort: 'name', page: 1 })).toBe('/directory');
  });

  it('includes only the values that differ from the defaults', () => {
    expect(buildDirectoryHref({ sort: 'batch_oldest', page: 1 })).toBe(
      '/directory?sort=batch_oldest',
    );
    expect(buildDirectoryHref({ sort: 'name', page: 2 })).toBe('/directory?page=2');
  });

  it('encodes the search text', () => {
    expect(buildDirectoryHref({ q: 'dr rai', sort: 'name', page: 1 })).toBe('/directory?q=dr+rai');
  });
});
