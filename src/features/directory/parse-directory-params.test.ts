import { describe, expect, it } from 'vitest';

import { parseDirectoryParams } from '@/features/directory/parse-directory-params';

describe('parseDirectoryParams', () => {
  it('uses defaults when the query is empty', () => {
    expect(parseDirectoryParams({})).toEqual({ sort: 'name', page: 1 });
  });

  it('reads the search text, sort and page', () => {
    expect(parseDirectoryParams({ q: ' cardiology ', sort: 'batch_newest', page: '3' })).toEqual({
      q: 'cardiology',
      sort: 'batch_newest',
      page: 3,
    });
  });

  it('ignores an unknown sort and a bad page', () => {
    expect(parseDirectoryParams({ sort: 'nonsense', page: '-4' })).toEqual({
      sort: 'name',
      page: 1,
    });
    expect(parseDirectoryParams({ page: 'abc' }).page).toBe(1);
  });

  it('takes the first value when a parameter is repeated and drops blank searches', () => {
    expect(parseDirectoryParams({ q: ['a', 'b'], page: ['2', '5'] })).toEqual({
      q: 'a',
      sort: 'name',
      page: 2,
    });
    expect(parseDirectoryParams({ q: '   ' }).q).toBeUndefined();
  });
});
