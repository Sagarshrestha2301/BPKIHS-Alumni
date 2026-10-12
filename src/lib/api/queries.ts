/**
 * Pure search, filter, sort and paginate functions for each list.
 * They know nothing about who is asking: visibility and moderation rules are applied
 * by the adapter before calling these.
 */
import { by, matchesQuery, normaliseText, paginate, sortBy } from './list-helpers';
import type {
  AlumniEvent,
  AlumniFilterOptions,
  AlumniListParams,
  Alumnus,
  EventListParams,
  FeedListParams,
  FeedPost,
  Paginated,
} from './types';

export function queryAlumni(
  alumni: readonly Alumnus[],
  params: AlumniListParams = {},
): Paginated<Alumnus> {
  const country = params.country ? normaliseText(params.country) : undefined;
  const city = params.city ? normaliseText(params.city) : undefined;

  const filtered = alumni.filter((person) => {
    if (params.programme && person.programme !== params.programme) return false;
    if (params.batchYear !== undefined && person.batchYear !== params.batchYear) return false;
    if (country && normaliseText(person.country) !== country) return false;
    if (city && normaliseText(person.city ?? '') !== city) return false;
    if (params.furtherStudies !== undefined) {
      const hasFurtherStudies = Boolean(person.furtherStudies?.trim());
      if (hasFurtherStudies !== params.furtherStudies) return false;
    }
    return matchesQuery(
      [
        person.fullName,
        person.programme,
        person.currentPosition,
        person.organisation,
        person.furtherStudies,
        person.city,
        person.country,
      ],
      params.q,
    );
  });

  const byName = by<Alumnus>((person) => person.fullName);
  switch (params.sort ?? 'name') {
    case 'batch_newest':
      return paginate(
        sortBy(
          filtered,
          by((p) => p.batchYear, 'desc'),
          byName,
        ),
        params,
      );
    case 'batch_oldest':
      return paginate(
        sortBy(
          filtered,
          by((p) => p.batchYear, 'asc'),
          byName,
        ),
        params,
      );
    case 'recently_joined':
      return paginate(
        sortBy(
          filtered,
          by((p) => Date.parse(p.createdAt), 'desc'),
          byName,
        ),
        params,
      );
    default:
      return paginate(sortBy(filtered, byName), params);
  }
}

export function queryEvents(
  events: readonly AlumniEvent[],
  params: EventListParams = {},
): Paginated<AlumniEvent> {
  const filtered = events.filter((event) => {
    if (params.status && event.status !== params.status) return false;
    return matchesQuery([event.title, event.summary, event.venue, event.city], params.q);
  });

  // Upcoming events read best soonest-first; past events newest-first.
  const sort = params.sort ?? (params.status === 'past' ? 'latest' : 'soonest');
  const direction = sort === 'soonest' ? 'asc' : 'desc';
  const sorted = sortBy(
    filtered,
    by((event: AlumniEvent) => Date.parse(event.startsAt), direction),
    by((event: AlumniEvent) => event.title),
  );
  return paginate(sorted, params);
}

export function queryFeed(
  posts: readonly FeedPost[],
  params: FeedListParams = {},
): Paginated<FeedPost> {
  const tag = params.tag ? normaliseText(params.tag) : undefined;

  const filtered = posts.filter((post) => {
    if (params.type && post.type !== params.type) return false;
    if (tag && !post.tags.some((t) => normaliseText(t) === tag)) return false;
    return matchesQuery([post.title, post.excerpt, post.author, ...post.tags], params.q);
  });

  const sorted = sortBy(
    filtered,
    by((post: FeedPost) => Date.parse(post.publishedAt), 'desc'),
    by((post: FeedPost) => post.title),
  );
  return paginate(sorted, params);
}

/** Distinct countries (A to Z) and batch years (newest first) among the given alumni. */
export function buildAlumniFilterOptions(alumni: readonly Alumnus[]): AlumniFilterOptions {
  const countries = [...new Set(alumni.map((person) => person.country))].sort((a, b) =>
    a.localeCompare(b),
  );
  const batchYears = [...new Set(alumni.map((person) => person.batchYear))].sort((a, b) => b - a);
  return { countries, batchYears };
}
