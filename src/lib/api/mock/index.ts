import type { ApiClient } from '../contract';
import { ApiError } from '../errors';
import { buildAlumniFilterOptions, queryAlumni, queryEvents, queryFeed } from '../queries';
import {
  donationSchema,
  helpdeskSchema,
  loginSchema,
  memberPostSchema,
  newsletterPrefsSchema,
  newsletterSubscribeSchema,
  postReportSchema,
  registrationSchema,
  rsvpSchema,
  signupSchema,
} from '../schemas';
import type { Alumnus, DonationResult, FeedPost, MemberPostType, Session } from '../types';
import { DEFAULT_VIEWER, isListable, toPublicView, type Viewer } from './privacy';
import { getSimulationOptions, type SimulationOptions, withSimulation } from './simulate';
import { createStore, type MockStore, type SubscriberRecord, type UserRecord } from './store';
import { parseInput } from './validate';

export interface MockAdapterOptions {
  /** Defaults to the environment-based simulation (none in tests). */
  simulation?: SimulationOptions;
  viewer?: Viewer;
  /** Injectable clock for tests. */
  now?: () => Date;
  /** What createDonation reports. Lets tests and demos produce failed or pending payments. */
  donationOutcome?: DonationResult['status'];
}

const POST_TAG: Record<MemberPostType, string> = {
  story: 'Stories',
  achievement: 'Achievement',
  notice: 'Notice',
  in_memoriam: 'In Memoriam',
};

const pad = (value: number, width = 3) => String(value).padStart(width, '0');
const blank = (value: string | undefined) => (value && value.length > 0 ? value : undefined);

export function createMockAdapter(options: MockAdapterOptions = {}): ApiClient {
  const store: MockStore = createStore();
  const viewer = options.viewer ?? DEFAULT_VIEWER;

  const run = <T>(action: () => T | Promise<T>) =>
    withSimulation(action, options.simulation ?? getSimulationOptions());

  const now = () => (options.now ? options.now() : new Date()).toISOString();
  const copy = <T>(value: T): T => structuredClone(value);
  const notFound = (what: string) => new ApiError('not_found', `${what} was not found.`);
  const nextNumber = (key: string) => {
    const next = (store.counters[key] ?? 0) + 1;
    store.counters[key] = next;
    return next;
  };

  const visibleAlumni = () => store.alumni.filter((person) => isListable(person, viewer));

  /** Recomputed from the goals, so it always adds up to the total raised. */
  const fundsBreakdown = () => {
    const total = store.goals.reduce((sum, goal) => sum + goal.raisedMinor, 0);
    let allocated = 0;
    return store.fundsBreakdown.map((item, index, all) => {
      const amountMinor =
        index === all.length - 1
          ? total - allocated
          : Math.round((total * item.sharePercent) / 100);
      allocated += amountMinor;
      return { ...item, amountMinor };
    });
  };

  const upsertSubscriber = (
    email: string,
    patch: Partial<Pick<SubscriberRecord, 'interests' | 'optIn'>>,
  ) => {
    const key = email.toLowerCase();
    const existing = store.subscribers.find((subscriber) => subscriber.email === key);
    if (existing) {
      Object.assign(existing, patch, { updatedAt: now() });
      return;
    }
    store.subscribers.push({
      email: key,
      interests: patch.interests ?? [],
      optIn: patch.optIn ?? true,
      updatedAt: now(),
    });
  };

  const toSession = (user: UserRecord): Session => ({
    userId: user.id,
    name: user.name,
    email: user.email,
  });

  return {
    /* ---------- reads ---------- */

    getSiteStats: () =>
      run(() => {
        const approved = store.alumni.filter((person) => person.status === 'approved');
        return {
          alumniCount: approved.length,
          raisedMinor: store.goals.reduce((sum, goal) => sum + goal.raisedMinor, 0),
          activeProgrammes: new Set(approved.map((person) => person.programme)).size,
          countries: new Set(approved.map((person) => person.country)).size,
          eventsHeld: store.events.filter((event) => event.status === 'past').length,
        };
      }),

    getWelcomeMessage: () => run(() => copy(store.welcome)),

    listAlumni: (params) =>
      run(() => {
        const result = queryAlumni(visibleAlumni(), params);
        return { ...result, items: result.items.map((person) => toPublicView(person, viewer)) };
      }),

    getAlumnus: (id) =>
      run(() => {
        const person = store.alumni.find((candidate) => candidate.id === id);
        // Hidden and unapproved profiles look exactly like missing ones.
        if (!person || !isListable(person, viewer)) throw notFound('That profile');
        return toPublicView(person, viewer);
      }),

    getAlumniFilterOptions: () => run(() => buildAlumniFilterOptions(visibleAlumni())),

    listGoals: () => run(() => copy(store.goals)),

    getGoal: (id) =>
      run(() => {
        const goal = store.goals.find((candidate) => candidate.id === id);
        if (!goal) throw notFound('That giving goal');
        return copy(goal);
      }),

    getFundsBreakdown: () => run(() => fundsBreakdown()),

    listBoard: ({ current }) =>
      run(() => copy(store.board.filter((member) => member.isCurrent === current))),

    listEvents: (params) => run(() => copy(queryEvents(store.events, params))),

    getEvent: (slug) =>
      run(() => {
        const event = store.events.find((candidate) => candidate.slug === slug);
        if (!event) throw notFound('That event');
        return copy(event);
      }),

    listFeed: (params) =>
      run(() =>
        copy(
          queryFeed(
            store.posts.filter((post) => post.status === 'approved'),
            params,
          ),
        ),
      ),

    listFaq: () => run(() => copy(store.faq)),

    /* ---------- writes ---------- */

    submitRegistration: (input) =>
      run(() => {
        const data = parseInput(registrationSchema, input);
        const id = `alumnus-new-${pad(nextNumber('registration'))}`;
        const furtherStudies = blank(data.furtherStudies);
        const currentPosition = blank(data.currentPosition);
        const organisation = blank(data.organisation);
        const city = blank(data.city);
        const note = blank(data.note);
        const phone = blank(data.phone);

        const person: Alumnus = {
          id,
          fullName: data.fullName,
          programme: data.programme,
          batchYear: data.batchYear,
          ...(furtherStudies ? { furtherStudies } : {}),
          ...(currentPosition ? { currentPosition } : {}),
          ...(organisation ? { organisation } : {}),
          ...(city ? { city } : {}),
          country: data.country,
          ...(note ? { note } : {}),
          email: data.email,
          ...(phone ? { phone } : {}),
          privacy: data.privacy,
          status: 'pending',
          source: 'self_registered',
          createdAt: now(),
        };
        store.alumni.push(person);
        return { id, status: 'pending' as const };
      }),

    createDonation: (input) =>
      run(() => {
        const data = parseInput(donationSchema, input);
        const goalId = data.goalId ?? 'general-fund';
        const goal = store.goals.find((candidate) => candidate.id === goalId);
        if (!goal) throw notFound('That giving goal');
        if (data.eventId && !store.events.some((event) => event.id === data.eventId)) {
          throw notFound('That event');
        }

        const status = options.donationOutcome ?? 'succeeded';
        const donationId = `donation-${pad(nextNumber('donation'), 4)}`;
        store.donations.push({
          id: donationId,
          goalId,
          ...(data.eventId ? { eventId: data.eventId } : {}),
          amountMinor: data.amountMinor,
          method: data.method,
          anonymous: data.anonymous,
          ...(data.tribute ? { tribute: data.tribute } : {}),
          status,
          createdAt: now(),
        });
        if (status === 'succeeded') goal.raisedMinor += data.amountMinor;

        return {
          donationId,
          status,
          ...(status === 'succeeded'
            ? { receiptUrl: `https://example.com/receipts/${donationId}.pdf` }
            : {}),
        };
      }),

    submitRsvp: (eventId, input) =>
      run(() => {
        const data = parseInput(rsvpSchema, input);
        const event = store.events.find((candidate) => candidate.id === eventId);
        if (!event) throw notFound('That event');
        if (event.status === 'past') {
          throw new ApiError('validation', 'This event has already taken place.');
        }

        const email = data.email.toLowerCase();
        if (store.rsvps.some((rsvp) => rsvp.eventId === eventId && rsvp.email === email)) {
          const message = 'You have already registered for this event with that email.';
          throw new ApiError('validation', message, { fieldErrors: { email: message } });
        }

        // A party that does not fit is recorded as a waitlist entry and the count does not move.
        const fits =
          event.capacity === undefined || event.rsvpCount + data.partySize <= event.capacity;
        const phone = blank(data.phone);
        store.rsvps.push({
          id: `rsvp-${pad(nextNumber('rsvp'), 4)}`,
          eventId,
          name: data.name,
          email,
          ...(phone ? { phone } : {}),
          partySize: data.partySize,
          waitlisted: !fits,
          createdAt: now(),
        });
        if (fits) event.rsvpCount += data.partySize;
        return { ok: true as const };
      }),

    submitPost: (input) =>
      run(() => {
        const data = parseInput(memberPostSchema, input);
        const id = `post-new-${pad(nextNumber('post'))}`;
        const excerpt =
          data.body.length > 140 ? `${data.body.slice(0, 137).trimEnd()}...` : data.body;
        const post: FeedPost = {
          id,
          type: data.type,
          status: 'pending',
          title: data.title,
          excerpt,
          body: data.body,
          author: data.authorName,
          publishedAt: now(),
          tags: [POST_TAG[data.type]],
        };
        store.posts.push(post);
        store.postAuthorEmails[id] = data.authorEmail;
        return { id, status: 'pending' as const };
      }),

    reportPost: (postId, input) =>
      run(() => {
        const data = parseInput(postReportSchema, input);
        const post = store.posts.find(
          (candidate) => candidate.id === postId && candidate.status === 'approved',
        );
        if (!post) throw notFound('That post');
        const details = blank(data.details);
        store.reports.push({
          id: `report-${pad(nextNumber('report'))}`,
          postId,
          reason: data.reason,
          ...(details ? { details } : {}),
          createdAt: now(),
        });
        return { ok: true as const };
      }),

    subscribeNewsletter: (input) =>
      run(() => {
        const data = parseInput(newsletterSubscribeSchema, input);
        upsertSubscriber(data.email, { interests: [...new Set(data.interests)], optIn: true });
        return { ok: true as const };
      }),

    updateNewsletterPrefs: (input) =>
      run(() => {
        const data = parseInput(newsletterPrefsSchema, input);
        const known = store.subscribers.some(
          (subscriber) => subscriber.email === data.email.toLowerCase(),
        );
        // Never reveal whether an address is subscribed: unknown addresses succeed quietly.
        if (known || data.optIn) upsertSubscriber(data.email, { optIn: data.optIn });
        return { ok: true as const };
      }),

    submitSupportTicket: (input) =>
      run(() => {
        const data = parseInput(helpdeskSchema, input);
        const ticketId = `TKT-${pad(nextNumber('ticket'), 4)}`;
        store.tickets.push({
          id: ticketId,
          topic: data.topic,
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          createdAt: now(),
        });
        return { ticketId };
      }),

    login: (input) =>
      run(() => {
        const data = parseInput(loginSchema, input);
        const user = store.users.find((candidate) => candidate.email === data.email.toLowerCase());
        if (!user) {
          throw new ApiError(
            'unauthorized',
            'We could not find an account for that email. Create one to continue.',
          );
        }
        return toSession(user);
      }),

    signup: (input) =>
      run(() => {
        const data = parseInput(signupSchema, input);
        const email = data.email.toLowerCase();
        if (store.users.some((candidate) => candidate.email === email)) {
          const message = 'An account with this email already exists. Sign in instead.';
          throw new ApiError('validation', message, { fieldErrors: { email: message } });
        }
        const phone = blank(data.phone);
        const user: UserRecord = {
          id: `user-${pad(nextNumber('user'))}`,
          name: data.fullName,
          email,
          ...(phone ? { phone } : {}),
          createdAt: now(),
        };
        store.users.push(user);
        return toSession(user);
      }),
  };
}

/** The shared instance the app uses. Tests create their own with createMockAdapter(). */
export const mockAdapter: ApiClient = createMockAdapter();
