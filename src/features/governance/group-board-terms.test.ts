import { describe, expect, it } from 'vitest';

import { groupByTerm } from '@/features/governance/group-board-terms';
import type { BoardMember } from '@/lib/api/types';

function member(id: string, term: string): BoardMember {
  return { id, name: 'Member ' + id, role: 'Member', term, isCurrent: false };
}

describe('groupByTerm', () => {
  it('groups members by term and puts the newest term first', () => {
    const groups = groupByTerm([
      member('a', '2020-2022'),
      member('b', '2022-2024'),
      member('c', '2020-2022'),
    ]);
    expect(groups.map((group) => group.term)).toEqual(['2022-2024', '2020-2022']);
    expect(groups[1]?.members.map((m) => m.id)).toEqual(['a', 'c']);
  });

  it('returns an empty list for no members', () => {
    expect(groupByTerm([])).toEqual([]);
  });
});
