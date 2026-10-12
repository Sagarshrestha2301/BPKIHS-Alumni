import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { featuredGoals } from '@/content/home';
import { FeaturedGoalsView } from '@/features/home/featured-goals-view';
import type { DonationGoal } from '@/lib/api/types';

function goal(id: string, overrides: Partial<DonationGoal> = {}): DonationGoal {
  return {
    id,
    title: `Goal ${id}`,
    description: 'A short description.',
    targetMinor: 100_000_00,
    raisedMinor: 25_000_00,
    currency: 'NPR',
    ...overrides,
  };
}

describe('FeaturedGoalsView', () => {
  it('shows a card with a progress bar for each goal', () => {
    render(<FeaturedGoalsView goals={[goal('a'), goal('b')]} />);
    expect(screen.getByRole('region', { name: featuredGoals.title })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('links every goal and the full list to /donate', () => {
    render(<FeaturedGoalsView goals={[goal('a')]} />);
    const give = screen.getByRole('link', { name: 'Give to this goal: Goal a' });
    expect(give.getAttribute('href')).toBe('/donate');
    const all = screen.getByRole('link', { name: featuredGoals.allGoalsLabel });
    expect(all.getAttribute('href')).toBe(featuredGoals.allGoalsHref);
  });

  it('renders nothing when there are no goals', () => {
    const { container } = render(<FeaturedGoalsView goals={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the sample note only for placeholder data', () => {
    const { rerender } = render(<FeaturedGoalsView goals={[goal('a', { placeholder: true })]} />);
    expect(screen.getByText('Sample data')).toBeTruthy();
    rerender(<FeaturedGoalsView goals={[goal('a')]} />);
    expect(screen.queryByText('Sample data')).toBeNull();
  });
});
