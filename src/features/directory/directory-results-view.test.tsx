import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { directoryPage } from '@/content/directory';
import { DirectoryResultsView } from '@/features/directory/directory-results-view';
import type { Alumnus, Paginated } from '@/lib/api/types';

function person(id: string, fullName: string): Alumnus {
  return {
    id,
    fullName,
    programme: 'MBBS',
    batchYear: 2005,
    city: 'Dharan',
    country: 'Nepal',
  } as Alumnus;
}

function page(items: Alumnus[], total: number, pageNumber = 1): Paginated<Alumnus> {
  return { items, total, page: pageNumber, pageSize: 12 };
}

const defaults = { sort: 'name', page: 1 } as const;

describe('DirectoryResultsView', () => {
  it('shows the count and a link for each person', () => {
    render(
      <DirectoryResultsView
        result={page([person('a1', 'Dr. Sita Rai'), person('a2', 'Dr. Anil Shah')], 2)}
        params={defaults}
      />,
    );
    expect(screen.getByText(/Showing 1.2 of 2 alumni/)).not.toBeNull();
    const link = screen.getByRole('link', { name: 'Dr. Sita Rai' });
    expect(link.getAttribute('href')).toBe('/directory/a1');
  });

  it('shows an empty state with a way to clear the search', () => {
    render(<DirectoryResultsView result={page([], 0)} params={{ q: 'zzz', ...defaults }} />);
    expect(screen.getByText(directoryPage.empty.title)).not.toBeNull();
    const clear = screen.getByRole('link', { name: directoryPage.empty.clear });
    expect(clear.getAttribute('href')).toBe('/directory');
  });

  it('links to the other pages and keeps the search text', () => {
    render(
      <DirectoryResultsView
        result={page([person('a1', 'Dr. Sita Rai')], 30)}
        params={{ q: 'mbbs', ...defaults }}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'pagination' });
    expect(nav).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Page 2' }).getAttribute('href')).toBe(
      '/directory?q=mbbs&page=2',
    );
  });

  it('has no page links when everything fits on one page', () => {
    render(
      <DirectoryResultsView result={page([person('a1', 'Dr. Sita Rai')], 1)} params={defaults} />,
    );
    expect(screen.queryByRole('navigation', { name: 'pagination' })).toBeNull();
  });
});
