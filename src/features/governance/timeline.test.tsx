import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Timeline } from '@/features/governance/timeline';

const items = [
  { key: 'a', when: 'First', title: 'Event A', text: 'Text A.' },
  { key: 'b', when: 'Second', title: 'Event B', text: 'Text B.' },
];

describe('Timeline', () => {
  it('is an ordered list with one item per event', () => {
    render(<Timeline items={items} />);
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the label, title and text of each event', () => {
    render(<Timeline items={items} />);
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Event B' })).toBeTruthy();
    expect(screen.getByText('Text A.')).toBeTruthy();
  });
});
