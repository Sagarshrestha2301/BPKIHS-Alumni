import { SITE_URL } from '@/lib/constants/site';

/**
 * Schema.org structured data for search engines.
 *
 * Values can come from the database (an event title, a page label), so everything is
 * serialised with `<` escaped: a title containing `</script>` must not end the tag it sits in.
 */
export type JsonLdValue = Record<string, unknown> | JsonLdValue[];

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function organizationJsonLd(input: {
  name: string;
  url?: string;
  logoUrl?: string;
  email?: string;
}): Record<string, unknown> {
  const url = input.url ?? SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url,
    ...(input.logoUrl ? { logo: new URL(input.logoUrl, url).toString() } : {}),
    ...(input.email ? { email: input.email } : {}),
  };
}

export type BreadcrumbTrailItem = { label: string; href?: string };

/** Google requires `item` on every crumb except the last, which is what the trail provides. */
export function breadcrumbJsonLd(trail: readonly BreadcrumbTrailItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: new URL(crumb.href, SITE_URL).toString() } : {}),
    })),
  };
}

export function eventJsonLd(input: {
  name: string;
  description: string;
  url: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  city: string;
  country: string;
  mode: 'in_person' | 'online' | 'hybrid';
  organiser: string;
}): Record<string, unknown> {
  const attendanceMode = {
    in_person: 'https://schema.org/OfflineEventAttendanceMode',
    online: 'https://schema.org/OnlineEventAttendanceMode',
    hybrid: 'https://schema.org/MixedEventAttendanceMode',
  }[input.mode];

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    description: input.description,
    url: input.url,
    startDate: input.startsAt,
    ...(input.endsAt ? { endDate: input.endsAt } : {}),
    eventAttendanceMode: attendanceMode,
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: input.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: input.city,
        addressCountry: input.country,
      },
    },
    organizer: { '@type': 'Organization', name: input.organiser, url: SITE_URL },
  };
}
