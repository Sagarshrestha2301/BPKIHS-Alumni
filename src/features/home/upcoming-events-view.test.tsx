import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { upcomingEvents } from '@/content/home';
import { UpcomingEventsView } from '@/features/home/upcoming-events-view';
import type { AlumniEvent } from '@/lib/api/types';

function event(slug: string, overrides: Partial<AlumniEvent> = {}): AlumniEvent {
  return {
    id: `id-${slug}`,
    slug,
    title: `Event ${slug}`,
    summary: 'Summary.',
    description: 'Description.',
    startsAt: '2026-11-05T04:15:00Z',
    venue: 'Main hall',
    city: 'Dharan',
    mode: 'in_person',
    rsvpCount: 12,
    status: 'upcoming',
    ...overrides,
  };
}

describe('UpcomingEventsView', () => {
  it('is a named section with a card for each event', () => {
    render(<UpcomingEventsView events={[event('a'), event('b')]} />);
    expect(screen.getByRole('region', { name: upcomingEvents.title })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('links each event to its page and the full list to /events', () => {
    render(<UpcomingEventsView events={[event('reunion')]} />);
    const rsvp = screen.getByRole('link', { name: 'RSVP and details: Event reunion' });
    expect(rsvp.getAttribute('href')).toBe('/events/reunion');
    const all = screen.getByRole('link', { name: upcomingEvents.allLabel });
    expect(all.getAttribute('href')).toBe(upcomingEvents.allHref);
  });

  it('shows the mode of each event', () => {
    render(<UpcomingEventsView events={[event('a', { mode: 'online' })]} />);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('renders nothing when there are no events', () => {
    const { container } = render(<UpcomingEventsView events={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
