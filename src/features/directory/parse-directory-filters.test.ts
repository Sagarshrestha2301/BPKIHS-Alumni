import { describe, expect, it } from 'vitest';

import { parseDirectoryParams } from '@/features/directory/parse-directory-params';

describe('parseDirectoryParams filters', () => {
  it('has no filter keys when the query has none', () => {
    const result = parseDirectoryParams({});
    expect(result).not.toHaveProperty('programme');
    expect(result).not.toHaveProperty('batchYear');
    expect(result).not.toHaveProperty('country');
    expect(result).not.toHaveProperty('city');
    expect(result).not.toHaveProperty('furtherStudies');
  });

  it('reads every filter', () => {
    expect(
      parseDirectoryParams({
        programme: 'BSc Nursing',
        batch: '2015',
        country: ' Nepal ',
        city: 'Dharan',
        further: '1',
      }),
    ).toEqual({
      sort: 'name',
      page: 1,
      programme: 'BSc Nursing',
      batchYear: 2015,
      country: 'Nepal',
      city: 'Dharan',
      furtherStudies: true,
    });
  });

  it('drops an unknown programme, a silly batch year and blank text', () => {
    const result = parseDirectoryParams({
      programme: 'Wizardry',
      batch: '3000',
      country: '   ',
      city: '',
    });
    expect(result).toEqual({ sort: 'name', page: 1 });
    expect(parseDirectoryParams({ batch: '1850' })).not.toHaveProperty('batchYear');
    expect(parseDirectoryParams({ batch: 'abc' })).not.toHaveProperty('batchYear');
  });

  it('accepts true for further studies and ignores anything else', () => {
    expect(parseDirectoryParams({ further: 'true' }).furtherStudies).toBe(true);
    expect(parseDirectoryParams({ further: '0' })).not.toHaveProperty('furtherStudies');
    expect(parseDirectoryParams({ further: 'yes' })).not.toHaveProperty('furtherStudies');
  });

  it('takes the first value of a repeated filter and caps long text', () => {
    expect(parseDirectoryParams({ programme: ['BDS', 'MBBS'] }).programme).toBe('BDS');
    expect(parseDirectoryParams({ city: 'x'.repeat(500) }).city).toHaveLength(100);
  });
});
