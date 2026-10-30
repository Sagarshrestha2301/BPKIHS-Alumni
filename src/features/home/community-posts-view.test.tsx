import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { communityPosts } from '@/content/home';
import { CommunityPostsView } from '@/features/home/community-posts-view';
import type { FeedPost } from '@/lib/api/types';

function post(id: string, overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id,
    type: 'news',
    status: 'approved',
    title: `Post ${id}`,
    excerpt: 'A short excerpt.',
    body: 'Full text.',
    author: 'A. Alumnus',
    publishedAt: '2026-10-01T04:15:00Z',
    tags: [],
    ...overrides,
  };
}

describe('CommunityPostsView', () => {
  it('is a named section with a card for each post', () => {
    render(<CommunityPostsView posts={[post('a'), post('b')]} />);
    expect(screen.getByRole('region', { name: communityPosts.title })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('shows the type label and the author', () => {
    render(<CommunityPostsView posts={[post('a', { type: 'achievement' })]} />);
    expect(screen.getByText('Achievement')).toBeTruthy();
    expect(screen.getByText('A. Alumnus')).toBeTruthy();
  });

  it('leads with the photo when the author supplied one', () => {
    const { container } = render(
      <CommunityPostsView posts={[post('a', { imageUrl: 'https://example.org/photo.jpg' })]} />,
    );
    const image = container.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://example.org/photo.jpg');
    // The title sits next to it, so the image is decorative for a screen reader.
    expect(image?.getAttribute('alt')).toBe('');
  });

  it('keeps the media height with a type panel when there is no photo', () => {
    const { container } = render(
      <CommunityPostsView posts={[post('a', { type: 'achievement' })]} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-slot="post-media"]')).not.toBeNull();
  });

  it('links to the full community page', () => {
    render(<CommunityPostsView posts={[post('a')]} />);
    const all = screen.getByRole('link', { name: communityPosts.allLabel });
    expect(all.getAttribute('href')).toBe(communityPosts.allHref);
  });

  it('renders nothing when there are no posts', () => {
    const { container } = render(<CommunityPostsView posts={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
