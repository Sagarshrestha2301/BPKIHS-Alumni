import { InitialsAvatar } from '@/components/shared/initials-avatar';
import type { BoardMember } from '@/lib/api/types';

type BoardMemberCardProps = {
  member: BoardMember;
  onSelect: (member: BoardMember) => void;
};

/** A board member as a button that opens their profile dialog. */
export function BoardMemberCard({ member, onSelect }: BoardMemberCardProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => onSelect(member)}
      className="hover:border-primary-700 flex min-h-11 w-full items-center gap-4 rounded-xl border border-neutral-300 bg-white p-5 text-left shadow-sm"
    >
      <InitialsAvatar name={member.name} />
      <span className="min-w-0">
        <span className="font-heading text-primary-900 block text-lg leading-snug font-semibold">
          {member.name}
        </span>
        <span className="block text-sm text-neutral-600">{member.role}</span>
        {member.batch ? (
          <span className="block text-sm text-neutral-600">{member.batch}</span>
        ) : null}
      </span>
    </button>
  );
}
