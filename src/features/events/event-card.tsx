import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { AlumniEvent } from '@/lib/api/types';
import type { EventMode } from '@/lib/constants/domain';
import { formatDate, formatDateTime } from '@/lib/format/dates';

export const EVENT_MODE_LABELS: Record<EventMode, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'Hybrid',
};

/** An event with a date block and an RSVP link. Reused on /events in Phase 7. */
export function EventCard({ event }: { event: AlumniEvent }) {
  const [day = '', month = ''] = formatDate(event.startsAt).split(' ');

  return (
    <article className="flex gap-4 rounded-xl border border-neutral-300 bg-white p-5 shadow-sm">
      <div
        aria-hidden="true"
        className="bg-primary-100 text-primary-900 flex size-16 shrink-0 flex-col items-center justify-center rounded-lg"
      >
        <span className="font-heading text-2xl leading-none font-bold">{day}</span>
        <span className="mt-1 text-xs font-semibold tracking-wide uppercase">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-primary-900 text-lg leading-snug font-semibold">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          <time dateTime={event.startsAt}>{formatDateTime(event.startsAt)}</time>
        </p>
        <p className="text-sm text-neutral-600">
          {event.venue}, {event.city}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{EVENT_MODE_LABELS[event.mode]}</Badge>
          <span className="text-sm text-neutral-600">{event.rsvpCount} going</span>
        </div>
        <Link
          href={`/events/${event.slug}`}
          aria-label={`RSVP and details: ${event.title}`}
          className="text-primary-700 hover:text-primary-900 focus-visible:ring-ring/50 mt-1 inline-flex min-h-11 items-center rounded-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
        >
          RSVP and details
        </Link>
      </div>
    </article>
  );
}
