import { CalendarDays } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { EmptyState } from '@/components/shared/empty-state';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { eventsPage } from '@/content/events';
import { EventCard } from '@/features/events/event-card';
import { getEventsPage } from '@/features/events/get-events-data';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: eventsPage.title,
  description: eventsPage.description,
  alternates: { canonical: '/events' },
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = first(params.status) === 'past' ? 'past' : 'upcoming';
  const q = first(params.q)?.trim();
  const page = await getEventsPage(status, q);
  const sample = page.items.some((event) => event.placeholder);

  return (
    <>
      <PageHeader
        crumbs={[{ label: eventsPage.title }]}
        title={eventsPage.title}
        description={eventsPage.description}
      />

      <Section>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <nav aria-label="Event views" className="flex gap-2">
            {(
              [
                ['upcoming', eventsPage.tabs.upcoming],
                ['past', eventsPage.tabs.past],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value}
                href={`/events?status=${value}`}
                aria-current={status === value ? 'page' : undefined}
                className={cn(
                  buttonVariants({ variant: status === value ? 'default' : 'outline' }),
                  'h-11 px-5 text-base',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <form action="/events" method="get" className="flex gap-2">
            <input type="hidden" name="status" value={status} />
            <label htmlFor="event-search" className="sr-only">
              {eventsPage.searchLabel}
            </label>
            <Input
              id="event-search"
              name="q"
              type="search"
              defaultValue={q ?? ''}
              placeholder={eventsPage.searchPlaceholder}
              className="h-11 w-full bg-white md:w-64"
            />
            <Button type="submit" className="h-11 px-4">
              {eventsPage.searchButton}
            </Button>
          </form>
        </div>

        {status === 'past' ? (
          <p className="mt-6 text-sm text-neutral-600">{eventsPage.pastNote}</p>
        ) : null}

        {page.items.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={eventsPage.empty}
            action={
              <Link href="/events" className={cn(buttonVariants({ variant: 'outline' }), 'h-11')}>
                {eventsPage.clear}
              </Link>
            }
            className="mt-10"
          />
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {page.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {sample ? <p className="mt-6 text-sm text-neutral-600">{eventsPage.sample}</p> : null}
      </Section>
    </>
  );
}
