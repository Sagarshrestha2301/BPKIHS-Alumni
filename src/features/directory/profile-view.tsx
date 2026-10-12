import Link from 'next/link';
import type { ReactNode } from 'react';

import { DonateLink } from '@/components/shared/donate-link';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { buttonVariants } from '@/components/ui/button';
import { directoryPage } from '@/content/directory';
import type { Alumnus } from '@/lib/api/types';
import { cn } from '@/lib/utils';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-neutral-600">{label}</dt>
      <dd className="text-base text-neutral-900">{children}</dd>
    </div>
  );
}

/**
 * One alumnus. Email and phone are shown only when the API sent them: the API removes anything
 * the person has not made visible, so this component never decides who may see what.
 */
export function ProfileView({ person }: { person: Alumnus }) {
  const copy = directoryPage.profile;
  const work = [person.currentPosition, person.organisation].filter(Boolean).join(', ');
  const place = [person.city, person.country].filter(Boolean).join(', ');

  return (
    <article className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-5">
        <InitialsAvatar name={person.fullName} size="lg" />
        <div>
          <p className="text-lg font-semibold text-neutral-900">
            {person.programme}, batch {person.batchYear}
          </p>
          {person.placeholder ? (
            <p className="mt-1 text-xs font-medium text-neutral-600">{copy.sample}</p>
          ) : null}
        </div>
      </div>

      <h2 className="sr-only">{copy.detailsLabel}</h2>
      <dl className="mt-8 grid gap-5">
        {work ? <Row label={copy.work}>{work}</Row> : null}
        {place ? <Row label={copy.place}>{place}</Row> : null}
        {person.furtherStudies ? <Row label={copy.further}>{person.furtherStudies}</Row> : null}
        {person.email ? (
          <Row label={copy.email}>
            <a href={'mailto:' + person.email} className="text-primary-700 underline">
              {person.email}
            </a>
          </Row>
        ) : null}
        {person.phone ? (
          <Row label={copy.phone}>
            <a
              href={'tel:' + person.phone.replace(/\s+/g, '')}
              className="text-primary-700 underline"
            >
              {person.phone}
            </a>
          </Row>
        ) : null}
        {person.note ? <Row label={copy.note}>{person.note}</Row> : null}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <DonateLink href="/donate" className="h-11 px-6">
          {copy.donate}
        </DonateLink>
        <Link href="/directory" className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5')}>
          {copy.back}
        </Link>
      </div>
    </article>
  );
}
