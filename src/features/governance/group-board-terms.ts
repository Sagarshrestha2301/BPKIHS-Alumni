import type { BoardMember } from '@/lib/api/types';

export type TermGroup = { term: string; members: BoardMember[] };

/** Groups members by term, newest term first. */
export function groupByTerm(members: readonly BoardMember[]): TermGroup[] {
  const byTerm = new Map<string, BoardMember[]>();
  for (const member of members) {
    const list = byTerm.get(member.term);
    if (list) list.push(member);
    else byTerm.set(member.term, [member]);
  }
  return [...byTerm.entries()]
    .map(([term, list]) => ({ term, members: list }))
    .sort((a, b) => b.term.localeCompare(a.term));
}
