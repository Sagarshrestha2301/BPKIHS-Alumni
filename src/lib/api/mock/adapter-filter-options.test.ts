import { describe, expect, it } from 'vitest';

import type { Alumnus } from '../types';
import { createMockAdapter } from './index';
import { NO_SIMULATION } from './simulate';

describe('mock adapter: filter options', () => {
  it('offers only countries and batch years of listed alumni', async () => {
    const api = createMockAdapter({ simulation: NO_SIMULATION });
    const listed: Alumnus[] = [];
    let page = 1;
    for (;;) {
      const result = await api.listAlumni({ pageSize: 50, page });
      listed.push(...result.items);
      if (listed.length >= result.total || result.items.length === 0) break;
      page += 1;
    }

    const options = await api.getAlumniFilterOptions();
    expect(options.countries).toEqual(
      [...new Set(listed.map((person) => person.country))].sort((a, b) => a.localeCompare(b)),
    );
    expect(options.batchYears).toEqual(
      [...new Set(listed.map((person) => person.batchYear))].sort((a, b) => b - a),
    );
  });
});
