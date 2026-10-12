import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { upcomingEvents } from '@/content/home';
import { EventCard } from '@/features/events/event-card';
import type { AlumniEvent } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** Hides itself when there are no upcoming events. */
export function UpcomingEventsView({ events }: { events: AlumniEvent[] }) {
  if (events.length === 0) return null;
  const sample = events.some((event) => event.placeholder);

  return (
    <Section aria-label={upcomingEvents.title}>
      <SectionHeading
        eyebrow={upcomingEvents.eyebrow}
        title={upcomingEvents.title}
        description={upcomingEvents.description}
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      <div className="mt-8">
        <Link
          href={upcomingEvents.allHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
        >
          {upcomingEvents.allLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      {sample ? <p className="mt-4 text-sm text-neutral-600">Sample data</p> : null}
    </Section>
  );
}
