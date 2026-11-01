import { ChevronRight } from 'lucide-react';

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
      className="group card-lift hover:border-primary-300 hover:shadow-card-hover flex min-h-11 w-full items-center gap-4 rounded-xl border border-neutral-300 bg-white p-5 text-left shadow-sm"
    >
      <div className="transition-transform duration-240 ease-out group-hover:scale-105">
        <InitialsAvatar name={member.name} />
      </div>
      <span className="min-w-0">
        <span className="font-heading text-primary-900 block text-lg leading-snug font-semibold">
          {member.name}
        </span>
        <span className="block text-sm text-neutral-600">{member.role}</span>
        {member.batch ? (
          <span className="block text-sm text-neutral-600">{member.batch}</span>
        ) : null}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="group-hover:text-primary-600 size-4 shrink-0 text-neutral-400 transition-transform duration-180 group-hover:translate-x-0.5"
      />
    </button>
  );
}
