import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { noticeBoard } from '@/content/home';
import { NoticeBoardView } from '@/features/home/notice-board-view';
import type { FeedPost } from '@/lib/api/types';

function notice(id: string, publishedAt: string, overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id,
    type: 'notice',
    status: 'approved',
    title: `Notice ${id}`,
    excerpt: 'A short excerpt.',
    body: 'Full text.',
    author: 'BPKIHS Alumni Association',
    publishedAt,
    tags: [],
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('NoticeBoardView', () => {
  it('renders nothing when there are no notices', () => {
    render(<NoticeBoardView notices={[]} />);
    expect(screen.queryByRole('region', { name: noticeBoard.title })).toBeNull();
    expect(screen.queryByRole('dialog', { name: noticeBoard.popupTitle })).toBeNull();
  });

  it('shows a closable board with a link per notice', async () => {
    render(
      <NoticeBoardView
        notices={[notice('a', '2026-10-20T04:00:00Z'), notice('b', '2026-10-18T04:00:00Z')]}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole('region', { name: noticeBoard.title })).toBeTruthy(),
    );
    expect(screen.getByRole('link', { name: /Notice a/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Notice b/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: noticeBoard.allLabel })).toBeTruthy();
  });

  it('closing the board hides it and offers a reopen button', async () => {
    render(<NoticeBoardView notices={[notice('a', '2026-10-20T04:00:00Z')]} />);
    await waitFor(() =>
      expect(screen.getByRole('region', { name: noticeBoard.title })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole('button', { name: noticeBoard.closeLabel }));
    expect(screen.queryByRole('region', { name: noticeBoard.title })).toBeNull();
    expect(
      screen.queryByRole('button', { name: new RegExp(`^${noticeBoard.openLabel}`) }),
    ).toBeTruthy();
    expect(localStorage.getItem('bpkihs.homeNotices.panelClosed')).toBe('2026-10-20T04:00:00Z');
  });

  it('a popup announces the newest unseen notice once and marks it seen on dismissal', async () => {
    const notices = [notice('new', '2026-10-20T04:00:00Z'), notice('old', '2026-10-19T04:00:00Z')];
    const { unmount } = render(<NoticeBoardView notices={notices} />);
    const dialog = await screen.findByRole('dialog', { name: noticeBoard.popupTitle });
    expect(dialog.textContent).toContain('Notice new');

    fireEvent.click(screen.getByRole('button', { name: noticeBoard.popupCloseLabel }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('bpkihs.homeNotices.seen')).toBe('2026-10-20T04:00:00Z');
    unmount();

    // Re-render with the same notices: the popup must not raise again this visit.
    render(<NoticeBoardView notices={notices} />);
    await waitFor(() =>
      expect(screen.getByRole('region', { name: noticeBoard.title })).toBeTruthy(),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('an already-seen notice pops no dialog', async () => {
    localStorage.setItem('bpkihs.homeNotices.seen', '2026-10-20T04:00:00Z');
    render(<NoticeBoardView notices={[notice('a', '2026-10-20T04:00:00Z')]} />);
    await waitFor(() =>
      expect(screen.getByRole('region', { name: noticeBoard.title })).toBeTruthy(),
    );
    // Wait past the popup timer to prove nothing pops.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
