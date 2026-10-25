import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { boardPreview } from '@/content/home';
import type { BoardMember } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** Hides itself when there is no current board. */
export function BoardPreviewView({ members }: { members: BoardMember[] }) {
  if (members.length === 0) return null;

  return (
    <Section aria-label={boardPreview.title}>
      <SectionHeading
        eyebrow={boardPreview.eyebrow}
        title={boardPreview.title}
        description={boardPreview.description}
      />
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-4 rounded-xl border border-neutral-300 bg-white p-5 shadow-sm"
          >
            <InitialsAvatar name={member.name} />
            <div className="min-w-0">
              <h3 className="font-heading text-primary-900 text-lg leading-snug font-semibold">
                {member.name}
              </h3>
              <p className="text-sm text-neutral-600">{member.role}</p>
              {member.batch ? <p className="text-sm text-neutral-600">{member.batch}</p> : null}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link
          href={boardPreview.allHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
        >
          {boardPreview.allLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
