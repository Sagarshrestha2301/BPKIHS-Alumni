import type { BoardMember } from '@/lib/api/types';

/** "President" only. "Vice President" and "Past President" do not count. */
function isPresident(member: BoardMember): boolean {
  return /^president\b/i.test(member.role.trim());
}

/** The current board for the home page: the president first, then the rest in data order. */
export function pickBoardPreview(members: readonly BoardMember[], count = 4): BoardMember[] {
  const current = members.filter((member) => member.isCurrent);
  const president = current.find(isPresident);
  const others = current.filter((member) => member !== president);
  return (president ? [president, ...others] : others).slice(0, count);
}
