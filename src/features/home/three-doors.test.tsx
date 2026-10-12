import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { doors } from '@/content/home';
import { ThreeDoors } from '@/features/home/three-doors';

describe('ThreeDoors', () => {
  it('is a named section with one h2 and three door headings', () => {
    render(<ThreeDoors />);
    expect(screen.getByRole('region', { name: doors.title })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('links every door to its page', () => {
    render(<ThreeDoors />);
    for (const door of doors.items) {
      for (const link of door.links) {
        const found = screen.getByRole('link', { name: link.label });
        expect(found.getAttribute('href')).toBe(link.href);
      }
    }
  });

  it('gives each door at least one link', () => {
    for (const door of doors.items) {
      expect(door.links.length).toBeGreaterThan(0);
    }
  });
});
