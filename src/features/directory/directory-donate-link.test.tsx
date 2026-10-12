import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DirectoryResultsView } from '@/features/directory/directory-results-view';
import type { Alumnus } from '@/lib/api/types';

const person: Alumnus = {
  id: 'alumnus-test',
  fullName: 'Asha Rai',
  programme: 'MBBS',
  batchYear: 2012,
  country: 'Nepal',
  privacy: { email: 'hidden', phone: 'hidden', profile: 'public' },
  status: 'approved',
  source: 'self_registered',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('DirectoryResultsView donate link', () => {
  it('links to /donate beside the result count', () => {
    render(
      <DirectoryResultsView
        result={{ items: [person], total: 1, page: 1, pageSize: 12 }}
        params={{ sort: 'name', page: 1 }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Support the Association' }).getAttribute('href')).toBe(
      '/donate',
    );
  });

  it('shows no donate link in the empty state', () => {
    render(
      <DirectoryResultsView
        result={{ items: [], total: 0, page: 1, pageSize: 12 }}
        params={{ sort: 'name', page: 1 }}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Support the Association' })).toBeNull();
  });
});
