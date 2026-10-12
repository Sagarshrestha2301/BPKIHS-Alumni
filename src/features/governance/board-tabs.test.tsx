import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { boardPage } from '@/content/board';
import { BoardTabs } from '@/features/governance/board-tabs';
import type { BoardMember } from '@/lib/api/types';

const president: BoardMember = {
  id: 'b1',
  name: 'Dr. Sita Rai',
  role: 'President',
  term: '2024-2026',
  batch: 'MBBS 2005',
  visionStatement: 'Keep every graduate connected to the institute.',
  isCurrent: true,
};

describe('BoardTabs', () => {
  it('lists current members as buttons', () => {
    render(<BoardTabs current={[president]} previous={[]} />);
    expect(screen.getByRole('button', { name: /Dr\. Sita Rai/ })).not.toBeNull();
  });

  it('opens a dialog with the vision statement when a member is chosen', () => {
    render(<BoardTabs current={[president]} previous={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Dr\. Sita Rai/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('Keep every graduate connected to the institute.');
  });

  it('says so when there is no current board', () => {
    render(<BoardTabs current={[]} previous={[]} />);
    expect(screen.getByText(boardPage.emptyCurrent)).not.toBeNull();
  });
});
