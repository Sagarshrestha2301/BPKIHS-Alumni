import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { DonateLink } from '@/components/shared/donate-link';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { directoryPage } from '@/content/directory';
import type { Alumnus } from '@/lib/api/types';
import { formatDate } from '@/lib/format/dates';

/**
 * One alumnus. Email and phone are shown only when the API sent them: the API removes anything
 * the person has not made visible, so this component never decides who may see what.
 *
 * The page is built from what the member actually filled in. Empty fields drop their whole
 * line or section rather than printing a placeholder, so a brief profile still reads cleanly.
 */
export function ProfileView({ person }: { person: Alumnus }) {
  const copy = directoryPage.profile;
  const place = [person.city, person.country].filter(Boolean).join(', ');
  const hasContact = Boolean(person.email || person.phone);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/directory"
        className="text-primary-700 hover:text-primary-900 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline underline-offset-4"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {copy.back}
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-8">
        <article className="overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm">
          <div className="border-b border-neutral-200 bg-neutral-100/60 p-6 md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {person.photoUrl ? (
                <Image
                  src={person.photoUrl}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized
                  className="size-24 shrink-0 rounded-full border border-neutral-300 object-cover"
                />
              ) : (
                <InitialsAvatar name={person.fullName} size="lg" className="size-24 text-3xl" />
              )}

              <div className="min-w-0">
                <p className="text-primary-700 text-sm font-medium">
                  {person.programme}, batch {person.batchYear}
                </p>
                {person.currentPosition ? (
                  <h2 className="font-heading text-primary-900 text-h3 lg:text-h3-lg mt-1 font-semibold">
                    {person.currentPosition}
                  </h2>
                ) : null}
                {person.organisation ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                    <Briefcase aria-hidden="true" className="size-4 shrink-0 text-neutral-600" />
                    {person.organisation}
                  </p>
                ) : null}
                {place ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-600">
                    <MapPin aria-hidden="true" className="size-4 shrink-0 text-neutral-600" />
                    {place}
                  </p>
                ) : null}
                {person.furtherStudies ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm text-neutral-600">
                    <GraduationCap
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-neutral-600"
                    />
                    <span>
                      {copy.further}: {person.furtherStudies}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            {person.expertise?.length ? (
              <ul aria-label={copy.expertise} className="mt-5 flex flex-wrap gap-2">
                {person.expertise.map((area) => (
                  <li
                    key={area}
                    className="bg-primary-100 text-primary-900 rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {person.note || hasContact ? (
            <div className="grid gap-8 p-6 md:p-8">
              {person.note ? (
                <section aria-labelledby="profile-about">
                  <h2
                    id="profile-about"
                    className="font-heading text-primary-900 text-h3 font-semibold"
                  >
                    {copy.about}
                  </h2>
                  <p className="text-body-l mt-3 max-w-prose whitespace-pre-line text-neutral-700">
                    {person.note}
                  </p>
                </section>
              ) : null}

              {hasContact ? (
                <section
                  aria-labelledby="profile-contact"
                  className={person.note ? 'border-t border-neutral-200 pt-6' : undefined}
                >
                  <h2
                    id="profile-contact"
                    className="font-heading text-primary-900 text-h3 font-semibold"
                  >
                    {copy.contact}
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {person.email ? (
                      <a
                        href={'mailto:' + person.email}
                        className="hover:border-primary-700 flex items-start gap-3 rounded-lg border border-neutral-300 p-4 transition-colors"
                      >
                        <Mail
                          aria-hidden="true"
                          className="text-primary-700 mt-0.5 size-4 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                            {copy.email}
                          </span>
                          <span className="text-primary-700 mt-0.5 block text-sm break-all underline underline-offset-4">
                            {person.email}
                          </span>
                        </span>
                      </a>
                    ) : null}
                    {person.phone ? (
                      <a
                        href={'tel:' + person.phone.replace(/\s+/g, '')}
                        className="hover:border-primary-700 flex items-start gap-3 rounded-lg border border-neutral-300 p-4 transition-colors"
                      >
                        <Phone
                          aria-hidden="true"
                          className="text-primary-700 mt-0.5 size-4 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold tracking-wide text-neutral-600 uppercase">
                            {copy.phone}
                          </span>
                          <span className="text-primary-700 mt-0.5 block text-sm underline underline-offset-4">
                            {person.phone}
                          </span>
                        </span>
                      </a>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <div className="border-t border-neutral-200 bg-neutral-100/60 px-6 py-3 md:px-8">
            <p className="text-xs text-neutral-600">
              {copy.listedSince} {formatDate(person.createdAt)}
            </p>
          </div>
        </article>

        <aside className="grid gap-5">
          <div className="border-accent-100 bg-accent-100/50 rounded-xl border p-5">
            <h2 className="font-heading text-primary-900 text-xl font-semibold">
              {copy.support.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{copy.support.text}</p>
            <DonateLink href="/donate" className="mt-4 h-11 w-full px-5">
              {copy.donate}
            </DonateLink>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-neutral-300 bg-white p-5">
            <ShieldCheck aria-hidden="true" className="text-primary-700 mt-0.5 size-4 shrink-0" />
            <p className="text-sm text-neutral-600">{copy.privacyNote}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
