import { describe, expect, it } from 'vitest';

import { pickBoardPreview } from '@/features/governance/pick-board-preview';
import type { BoardMember } from '@/lib/api/types';

function member(id: string, role: string, isCurrent = true): BoardMember {
  return { id, name: `Member ${id}`, role, term: '2025-2027', isCurrent };
}

describe('pickBoardPreview', () => {
  it('puts the president first', () => {
    const picked = pickBoardPreview([
      member('a', 'Secretary'),
      member('b', 'President'),
      member('c', 'Treasurer'),
    ]);
    expect(picked.map((m) => m.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not mistake a vice president for the president', () => {
    const picked = pickBoardPreview([member('a', 'Vice President'), member('b', 'Secretary')]);
    expect(picked.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('returns at most four members and skips past boards', () => {
    const picked = pickBoardPreview([
      member('a', 'President'),
      member('b', 'Secretary'),
      member('c', 'Treasurer'),
      member('d', 'Member'),
      member('e', 'Member'),
      member('old', 'President', false),
    ]);
    expect(picked).toHaveLength(4);
    expect(picked.some((m) => m.id === 'old')).toBe(false);
  });

  it('returns an empty list when nobody is on the current board', () => {
    expect(pickBoardPreview([member('old', 'President', false)])).toEqual([]);
  });
});
