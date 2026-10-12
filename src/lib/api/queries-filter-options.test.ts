import { describe, expect, it } from 'vitest';

import { buildAlumniFilterOptions } from './queries';
import type { Alumnus } from './types';

function person(id: string, country: string, batchYear: number): Alumnus {
  return { id, fullName: 'Person ' + id, country, batchYear } as Alumnus;
}

describe('buildAlumniFilterOptions', () => {
  it('lists each country once, A to Z, and batch years newest first', () => {
    const options = buildAlumniFilterOptions([
      person('a', 'Nepal', 2005),
      person('b', 'Australia', 2010),
      person('c', 'Nepal', 2010),
    ]);
    expect(options.countries).toEqual(['Australia', 'Nepal']);
    expect(options.batchYears).toEqual([2010, 2005]);
  });

  it('returns empty lists for no alumni', () => {
    expect(buildAlumniFilterOptions([])).toEqual({ countries: [], batchYears: [] });
  });
});
