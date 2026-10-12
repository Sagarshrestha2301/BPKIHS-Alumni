import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { boardPreview } from '@/content/home';
import { BoardPreviewView } from '@/features/home/board-preview-view';
import type { BoardMember } from '@/lib/api/types';

function member(id: string, overrides: Partial<BoardMember> = {}): BoardMember {
  return {
    id,
    name: `Member ${id}`,
    role: 'Secretary',
    term: '2025-2027',
    isCurrent: true,
    ...overrides,
  };
}

describe('BoardPreviewView', () => {
  it('is a named section with a heading for each member', () => {
    render(<BoardPreviewView members={[member('a'), member('b')]} />);
    expect(screen.getByRole('region', { name: boardPreview.title })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('shows the role of each member', () => {
    render(<BoardPreviewView members={[member('a', { role: 'President' })]} />);
    expect(screen.getByText('President')).toBeTruthy();
  });

  it('links to the full board', () => {
    render(<BoardPreviewView members={[member('a')]} />);
    const link = screen.getByRole('link', { name: boardPreview.allLabel });
    expect(link.getAttribute('href')).toBe(boardPreview.allHref);
  });

  it('renders nothing without members', () => {
    const { container } = render(<BoardPreviewView members={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
