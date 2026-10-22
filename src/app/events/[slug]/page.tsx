import { CalendarPlus, MapPin, Play, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { eventDetailPage } from '@/content/events';
import { GoalCard } from '@/features/donations/goal-card';
import { EVENT_MODE_LABELS } from '@/features/events/event-card';
import { getEventBySlug, getEventGoal } from '@/features/events/get-events-data';
import { RsvpForm } from '@/features/events/rsvp-form';
import type { AlumniEvent } from '@/lib/api/types';
import { formatDateRange } from '@/lib/format/dates';
import { cn } from '@/lib/utils';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) return { title: 'Event not found' };
  return {
    title: event.title,
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}` },
  };
}

function calendarHref(event: AlumniEvent): string {
  const stamp = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BPKIHS Alumni Association//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@bpkihs-alumni`,
    `DTSTAMP:${stamp(event.startsAt)}`,
    `DTSTART:${stamp(event.startsAt)}`,
    ...(event.endsAt ? [`DTEND:${stamp(event.endsAt)}`] : []),
    `SUMMARY:${event.title}`,
    `LOCATION:${event.venue}, ${event.city}`,
    `DESCRIPTION:${event.summary}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) notFound();

  const goal = await getEventGoal(event.goalId);
  const percent =
    event.capacity === undefined
      ? null
      : Math.min(100, Math.round((event.rsvpCount / event.capacity) * 100));
  const full = event.capacity !== undefined && event.rsvpCount >= event.capacity;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Events', href: '/events' }, { label: event.title }]}
        title={event.title}
        description={event.summary}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="space-y-8">
            <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-600">{eventDetailPage.date}</dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {formatDateRange(event.startsAt, event.endsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-600">{eventDetailPage.venue}</dt>
                  <dd className="mt-1 flex items-start gap-1.5 font-medium text-neutral-900">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {event.venue}, {event.city}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-600">{eventDetailPage.mode}</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">{EVENT_MODE_LABELS[event.mode]}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-600">{eventDetailPage.capacityLabel}</dt>
                  <dd className="mt-1 font-medium text-neutral-900">
                    {event.capacity === undefined
                      ? eventDetailPage.unlimited
                      : `${event.rsvpCount} of ${event.capacity} ${eventDetailPage.places}`}
                  </dd>
                </div>
              </dl>

              {percent !== null ? (
                <div className="mt-5">
                  <div
                    role="progressbar"
                    aria-label={eventDetailPage.capacityLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-valuetext={`${percent}% full`}
                    className="bg-primary-100 h-2.5 w-full overflow-hidden rounded-full"
                  >
                    <div
                      className="bg-primary-700 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {full ? (
                    <p className="text-danger-600 mt-2 text-sm font-medium">
                      {eventDetailPage.full}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-5 text-base leading-relaxed text-neutral-600">{event.description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={calendarHref(event)}
                  download={`${event.slug}.ics`}
                  className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
                >
                  <CalendarPlus aria-hidden="true" />
                  {eventDetailPage.calendar}
                </a>
                <Link
                  href="/events"
                  className={cn(buttonVariants({ variant: 'ghost' }), 'h-11 px-5 text-base')}
                >
                  {eventDetailPage.back}
                </Link>
              </div>
            </div>

            {goal ? (
              <div>
                <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                  {eventDetailPage.linkedGoalTitle}
                </h2>
                <div className="mt-4 max-w-md">
                  <GoalCard goal={goal} />
                </div>
              </div>
            ) : null}

            {event.status === 'past' ? (
              <div>
                <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                  {eventDetailPage.pastTitle}
                </h2>
                <p className="mt-2 text-neutral-600">{eventDetailPage.pastEventNote}</p>
                {event.gallery && event.gallery.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="text-primary-900 text-lg font-semibold">
                      {eventDetailPage.galleryTitle}
                    </h3>
                    <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                      {event.gallery.map((item) =>
                        item.type === 'photo' ? (
                          <li key={item.url + item.alt}>
                            <Image
                              src={item.url}
                              alt={item.alt}
                              width={640}
                              height={400}
                              className="h-48 w-full rounded-lg border border-neutral-300 object-cover"
                            />
                          </li>
                        ) : (
                          <li key={item.url}>
                            <a
                              href={item.url}
                              className="text-primary-700 flex h-48 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 font-medium"
                            >
                              <Play aria-hidden="true" className="size-5" />
                              {item.alt}
                            </a>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            {event.status === 'upcoming' ? (
              <RsvpForm eventId={event.id} capacity={event.capacity} rsvpCount={event.rsvpCount} />
            ) : (
              <div className="rounded-xl border border-neutral-300 bg-neutral-100/60 p-6">
                <Users aria-hidden="true" className="text-primary-700 size-6" />
                <p className="mt-3 font-medium text-neutral-900">{eventDetailPage.pastEventNote}</p>
              </div>
            )}
            <p className="text-sm text-neutral-600">{eventDetailPage.shareNote}</p>
          </aside>
        </div>
      </Section>
    </>
  );
}
