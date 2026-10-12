import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '@/components/layout/page-header';

describe('PageHeader', () => {
  it('has the title as the only h1', () => {
    render(<PageHeader crumbs={[{ label: 'About' }]} title="About us" />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'About us' })).toBeTruthy();
  });

  it('starts the trail at Home and marks the last crumb as the current page', () => {
    render(
      <PageHeader
        crumbs={[{ label: 'About', href: '/about' }, { label: 'Board' }]}
        title="Board"
      />,
    );
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/about');
    const current = document.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('Board');
  });

  it('shows the description only when given', () => {
    const { rerender } = render(
      <PageHeader crumbs={[{ label: 'About' }]} title="About us" description="Who we are." />,
    );
    expect(screen.getByText('Who we are.')).toBeTruthy();
    rerender(<PageHeader crumbs={[{ label: 'About' }]} title="About us" />);
    expect(screen.queryByText('Who we are.')).toBeNull();
  });
});
