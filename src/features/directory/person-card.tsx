import Image from 'next/image';
import Link from 'next/link';

import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { directoryPage } from '@/content/directory';
import type { Alumnus } from '@/lib/api/types';

/** One alumnus. The name is the link; it stretches over the whole card. */
export function PersonCard({ person }: { person: Alumnus }) {
  const work = [person.currentPosition, person.organisation].filter(Boolean).join(', ');
  const place = [person.city, person.country].filter(Boolean).join(', ');

  return (
    /* The whole card is one stretched link, so it lifts like every other clickable card. */
    <div className="group card-lift hover:border-primary-700/50 relative flex h-full items-start gap-4 rounded-xl border border-neutral-300/80 bg-white p-5 shadow-xs transition-all duration-180 hover:shadow-md">
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        {person.photoUrl ? (
          <Image
            src={person.photoUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="group-hover:ring-primary-700/20 size-16 rounded-full border border-neutral-300/80 object-cover shadow-xs ring-2 ring-transparent transition-all duration-180"
          />
        ) : (
          <InitialsAvatar name={person.fullName} />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-heading text-primary-900 group-hover:text-primary-700 text-lg leading-snug font-semibold tracking-tight transition-colors duration-180">
          <Link
            href={'/directory/' + person.id}
            className="after:absolute after:inset-0 after:rounded-xl"
          >
            {person.fullName}
          </Link>
        </h3>
        <p className="text-sm font-medium text-neutral-600">
          {person.programme}, batch {person.batchYear}
        </p>
        {work ? <p className="mt-0.5 text-xs text-neutral-600">{work}</p> : null}
        {place ? <p className="mt-0.5 text-xs text-neutral-600">{place}</p> : null}
        {person.expertise?.length ? (
          <ul
            className="mt-2.5 flex flex-wrap gap-1.5"
            aria-label={directoryPage.profile.expertise}
          >
            {person.expertise.slice(0, 3).map((area) => (
              <li
                key={area}
                className="bg-primary-100/80 text-primary-900 border-primary-200/50 group-hover:bg-primary-100 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
              >
                {area}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
