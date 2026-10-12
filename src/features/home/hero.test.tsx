import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { hero } from '@/content/home';
import { Hero } from '@/features/home/hero';

describe('Hero', () => {
  it('has the headline as the only h1', () => {
    render(<Hero />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: hero.title })).toBeTruthy();
  });

  it('offers three calls to action that go to the right pages', () => {
    render(<Hero />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    for (const cta of hero.ctas) {
      const link = screen.getByRole('link', { name: cta.label });
      expect(link.getAttribute('href')).toBe(cta.href);
    }
  });

  it('keeps the warm colour for Give only', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'Give now' }).className).toContain('bg-accent-600');
    expect(screen.getByRole('link', { name: 'Find alumni' }).className).not.toContain(
      'bg-accent-600',
    );
    expect(screen.getByRole('link', { name: 'Join the network' }).className).not.toContain(
      'bg-accent-600',
    );
  });
});
