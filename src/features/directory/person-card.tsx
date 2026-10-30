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
    <div className="hover:border-primary-700 relative flex h-full items-start gap-4 rounded-xl border border-neutral-300 bg-white p-5 shadow-sm">
      {person.photoUrl ? (
        <Image
          src={person.photoUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-16 shrink-0 rounded-full border border-neutral-300 object-cover"
        />
      ) : (
        <InitialsAvatar name={person.fullName} />
      )}
      <div className="min-w-0">
        <h3 className="font-heading text-primary-900 text-lg leading-snug font-semibold">
          <Link
            href={'/directory/' + person.id}
            className="after:absolute after:inset-0 after:rounded-xl"
          >
            {person.fullName}
          </Link>
        </h3>
        <p className="text-sm text-neutral-600">
          {person.programme}, batch {person.batchYear}
        </p>
        {work ? <p className="text-sm text-neutral-600">{work}</p> : null}
        {place ? <p className="text-sm text-neutral-600">{place}</p> : null}
        {person.expertise?.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={directoryPage.profile.expertise}>
            {person.expertise.slice(0, 3).map((area) => (
              <li
                key={area}
                className="bg-primary-100 text-primary-900 rounded-full px-2 py-0.5 text-xs font-medium"
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
