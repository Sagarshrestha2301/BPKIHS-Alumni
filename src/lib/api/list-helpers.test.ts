import { describe, expect, it } from 'vitest';

import {
  by,
  DEFAULT_PAGE_SIZE,
  matchesQuery,
  MAX_PAGE_SIZE,
  normaliseText,
  paginate,
  resolvePaging,
  sortBy,
} from './list-helpers';

describe('normaliseText', () => {
  it('lower-cases, removes accents and collapses spaces', () => {
    expect(normaliseText('  Zoë   KARKI ')).toBe('zoe karki');
  });
});

describe('matchesQuery', () => {
  const fields = ['Asha Rai', 'MD Cardiology', 'Kathmandu'];

  it('matches everything when the query is empty', () => {
    expect(matchesQuery(fields, '')).toBe(true);
    expect(matchesQuery(fields, undefined)).toBe(true);
    expect(matchesQuery(fields, '   ')).toBe(true);
  });

  it('ignores case and accents', () => {
    expect(matchesQuery(['Zoë Karki'], 'ZOE')).toBe(true);
  });

  it('needs every word to match', () => {
    expect(matchesQuery(fields, 'asha cardiology')).toBe(true);
    expect(matchesQuery(fields, 'asha surgery')).toBe(false);
  });

  it('matches part of a word and skips missing fields', () => {
    expect(matchesQuery([undefined, 'Kathmandu'], 'kath')).toBe(true);
  });
});

describe('resolvePaging', () => {
  it('uses the defaults for missing or invalid values', () => {
    expect(resolvePaging()).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    expect(resolvePaging({ page: 0, pageSize: -5 })).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
    expect(resolvePaging({ page: Number.NaN })).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('rounds down and caps the page size', () => {
    expect(resolvePaging({ page: 2.9, pageSize: 10.5 })).toEqual({ page: 2, pageSize: 10 });
    expect(resolvePaging({ pageSize: 1000 }).pageSize).toBe(MAX_PAGE_SIZE);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1);

  it('returns the first page with the total', () => {
    const result = paginate(items, { page: 1, pageSize: 10 });
    expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result).toMatchObject({ total: 25, page: 1, pageSize: 10 });
  });

  it('returns a short last page', () => {
    expect(paginate(items, { page: 3, pageSize: 10 }).items).toEqual([21, 22, 23, 24, 25]);
  });

  it('returns no items for a page past the end, and echoes the page', () => {
    const result = paginate(items, { page: 9, pageSize: 10 });
    expect(result.items).toEqual([]);
    expect(result.page).toBe(9);
    expect(result.total).toBe(25);
  });

  it('handles an empty list', () => {
    expect(paginate([], {})).toEqual({ items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });
});

describe('by and sortBy', () => {
  const rows = [
    { name: 'Bikash', year: 2018 },
    { name: 'asha', year: 2010 },
    { name: 'Chandra', year: 2018 },
  ];

  it('sorts text ignoring case', () => {
    expect(
      sortBy(
        rows,
        by((row) => row.name),
      ).map((row) => row.name),
    ).toEqual(['asha', 'Bikash', 'Chandra']);
  });

  it('sorts numbers descending and breaks ties with the next comparator', () => {
    const sorted = sortBy(
      rows,
      by((row) => row.year, 'desc'),
      by((row) => row.name),
    );
    expect(sorted.map((row) => row.name)).toEqual(['Bikash', 'Chandra', 'asha']);
  });

  it('does not change the original array', () => {
    const copy = [...rows];
    sortBy(
      rows,
      by((row) => row.year),
    );
    expect(rows).toEqual(copy);
  });
});
