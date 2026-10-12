import { describe, expect, it } from 'vitest';

import { queryAlumni, queryEvents, queryFeed } from './queries';
import type { AlumniEvent, Alumnus, FeedPost } from './types';

function person(overrides: Partial<Alumnus> & Pick<Alumnus, 'id' | 'fullName'>): Alumnus {
  return {
    programme: 'MBBS',
    batchYear: 2010,
    country: 'Nepal',
    privacy: { email: 'hidden', phone: 'hidden', profile: 'public' },
    status: 'approved',
    source: 'self_registered',
    createdAt: '2026-01-01T00:00:00Z',
    placeholder: true,
    ...overrides,
  };
}

const alumni: Alumnus[] = [
  person({
    id: 'a1',
    fullName: 'Asha Rai',
    batchYear: 2010,
    city: 'Kathmandu',
    furtherStudies: 'MD Cardiology',
    createdAt: '2026-01-01T00:00:00Z',
  }),
  person({
    id: 'a2',
    fullName: 'Bikash Shrestha',
    programme: 'BMIT',
    batchYear: 2018,
    city: 'Dharan',
    createdAt: '2026-03-01T00:00:00Z',
  }),
  person({
    id: 'a3',
    fullName: 'Chandra Gurung',
    batchYear: 2015,
    country: 'India',
    city: 'Delhi',
    furtherStudies: '  ',
    createdAt: '2026-02-01T00:00:00Z',
  }),
  person({
    id: 'a4',
    fullName: 'Zoë Karki',
    programme: 'MD/MS',
    batchYear: 2020,
    city: 'Pokhara',
    createdAt: '2026-04-01T00:00:00Z',
  }),
];

const ids = (list: { items: { id: string }[] }) => list.items.map((item) => item.id);

describe('queryAlumni', () => {
  it('returns everyone by name when there are no params', () => {
    expect(ids(queryAlumni(alumni))).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('searches names without caring about case or accents', () => {
    expect(ids(queryAlumni(alumni, { q: 'ASHA' }))).toEqual(['a1']);
    expect(ids(queryAlumni(alumni, { q: 'zoe' }))).toEqual(['a4']);
  });

  it('searches specialisation, location and programme', () => {
    expect(ids(queryAlumni(alumni, { q: 'cardiology' }))).toEqual(['a1']);
    expect(ids(queryAlumni(alumni, { q: 'delhi' }))).toEqual(['a3']);
    expect(ids(queryAlumni(alumni, { q: 'bmit' }))).toEqual(['a2']);
  });

  it('needs every search word to match', () => {
    expect(ids(queryAlumni(alumni, { q: 'asha cardiology' }))).toEqual(['a1']);
    expect(ids(queryAlumni(alumni, { q: 'asha delhi' }))).toEqual([]);
  });

  it('filters by programme, batch, country and city', () => {
    expect(ids(queryAlumni(alumni, { programme: 'BMIT' }))).toEqual(['a2']);
    expect(ids(queryAlumni(alumni, { batchYear: 2015 }))).toEqual(['a3']);
    expect(ids(queryAlumni(alumni, { country: 'india' }))).toEqual(['a3']);
    expect(ids(queryAlumni(alumni, { city: 'pokhara' }))).toEqual(['a4']);
  });

  it('filters by further studies, treating blank text as none', () => {
    expect(ids(queryAlumni(alumni, { furtherStudies: true }))).toEqual(['a1']);
    expect(ids(queryAlumni(alumni, { furtherStudies: false }))).toEqual(['a2', 'a3', 'a4']);
  });

  it('combines filters', () => {
    expect(ids(queryAlumni(alumni, { country: 'nepal', programme: 'MBBS' }))).toEqual(['a1']);
  });

  it('sorts newest batch, oldest batch and recently joined', () => {
    expect(ids(queryAlumni(alumni, { sort: 'batch_newest' }))).toEqual(['a4', 'a2', 'a3', 'a1']);
    expect(ids(queryAlumni(alumni, { sort: 'batch_oldest' }))).toEqual(['a1', 'a3', 'a2', 'a4']);
    expect(ids(queryAlumni(alumni, { sort: 'recently_joined' }))).toEqual(['a4', 'a2', 'a3', 'a1']);
  });

  it('paginates after filtering, and the total reflects the filter', () => {
    const first = queryAlumni(alumni, { country: 'nepal', pageSize: 2 });
    expect(ids(first)).toEqual(['a1', 'a2']);
    expect(first.total).toBe(3);
    expect(ids(queryAlumni(alumni, { country: 'nepal', pageSize: 2, page: 2 }))).toEqual(['a4']);
  });

  it('does not change the input list', () => {
    const copy = [...alumni];
    queryAlumni(alumni, { sort: 'batch_newest' });
    expect(alumni).toEqual(copy);
  });
});

function event(
  overrides: Partial<AlumniEvent> & Pick<AlumniEvent, 'id' | 'title' | 'startsAt' | 'status'>,
): AlumniEvent {
  return {
    slug: overrides.id,
    summary: 'Summary',
    description: 'Description',
    venue: 'Main hall',
    city: 'Dharan',
    mode: 'in_person',
    rsvpCount: 0,
    placeholder: true,
    ...overrides,
  };
}

const events: AlumniEvent[] = [
  event({
    id: 'e1',
    title: 'Reunion dinner',
    startsAt: '2026-10-20T12:00:00Z',
    status: 'upcoming',
  }),
  event({
    id: 'e2',
    title: 'Career talk',
    startsAt: '2026-11-05T12:00:00Z',
    status: 'upcoming',
    city: 'Kathmandu',
  }),
  event({ id: 'e3', title: 'Winter camp', startsAt: '2026-01-10T12:00:00Z', status: 'past' }),
  event({ id: 'e4', title: 'Batch meet', startsAt: '2026-03-10T12:00:00Z', status: 'past' }),
];

describe('queryEvents', () => {
  it('lists upcoming events soonest first by default', () => {
    expect(ids(queryEvents(events, { status: 'upcoming' }))).toEqual(['e1', 'e2']);
  });

  it('lists past events newest first by default', () => {
    expect(ids(queryEvents(events, { status: 'past' }))).toEqual(['e4', 'e3']);
  });

  it('lets an explicit sort win', () => {
    expect(ids(queryEvents(events, { status: 'upcoming', sort: 'latest' }))).toEqual(['e2', 'e1']);
  });

  it('searches title and city', () => {
    expect(ids(queryEvents(events, { q: 'career' }))).toEqual(['e2']);
    expect(ids(queryEvents(events, { q: 'kathmandu' }))).toEqual(['e2']);
  });
});

function post(
  overrides: Partial<FeedPost> & Pick<FeedPost, 'id' | 'title' | 'publishedAt'>,
): FeedPost {
  return {
    type: 'news',
    status: 'approved',
    excerpt: 'Excerpt',
    body: 'Body',
    author: 'Editor',
    tags: [],
    placeholder: true,
    ...overrides,
  };
}

const posts: FeedPost[] = [
  post({ id: 'p1', title: 'Annual report', publishedAt: '2026-05-01T00:00:00Z', tags: ['Giving'] }),
  post({
    id: 'p2',
    title: 'My residency story',
    type: 'story',
    author: 'Asha Rai',
    publishedAt: '2026-07-01T00:00:00Z',
    tags: ['Residency', 'Stories'],
  }),
  post({
    id: 'p3',
    title: 'In memory of a mentor',
    type: 'in_memoriam',
    publishedAt: '2026-06-01T00:00:00Z',
  }),
];

describe('queryFeed', () => {
  it('lists newest first', () => {
    expect(ids(queryFeed(posts))).toEqual(['p2', 'p3', 'p1']);
  });

  it('filters by type', () => {
    expect(ids(queryFeed(posts, { type: 'in_memoriam' }))).toEqual(['p3']);
  });

  it('filters by tag, ignoring case', () => {
    expect(ids(queryFeed(posts, { tag: 'residency' }))).toEqual(['p2']);
  });

  it('searches title, author and tags', () => {
    expect(ids(queryFeed(posts, { q: 'asha' }))).toEqual(['p2']);
    expect(ids(queryFeed(posts, { q: 'giving' }))).toEqual(['p1']);
  });
});
