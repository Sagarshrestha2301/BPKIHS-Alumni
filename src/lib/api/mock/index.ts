import type { ApiClient } from '../contract';
import { ApiError } from '../errors';
import { createNotImplementedClient } from '../not-implemented';
import { queryAlumni, queryEvents, queryFeed } from '../queries';
import { DEFAULT_VIEWER, isListable, toPublicView, type Viewer } from './privacy';
import { getSimulationOptions, type SimulationOptions, withSimulation } from './simulate';
import { createStore, type MockStore } from './store';

export interface MockAdapterOptions {
  /** Defaults to the environment-based simulation (none in tests). */
  simulation?: SimulationOptions;
  viewer?: Viewer;
}

/**
 * Write methods arrive in step 3e-2; until then they reject with not_implemented.
 * Reads below are complete.
 */
export function createMockAdapter(options: MockAdapterOptions = {}): ApiClient {
  const store: MockStore = createStore();
  const viewer = options.viewer ?? DEFAULT_VIEWER;
  const pending = createNotImplementedClient('Mock adapter (writes arrive in step 3e-2)');
  const run = <T>(action: () => T | Promise<T>) =>
    withSimulation(action, options.simulation ?? getSimulationOptions());

  const copy = <T>(value: T): T => structuredClone(value);
  const notFound = (what: string) => new ApiError('not_found', `${what} was not found.`);

  const visibleAlumni = () => store.alumni.filter((person) => isListable(person, viewer));

  return {
    ...pending,

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

    listGoals: () => run(() => copy(store.goals)),

    getGoal: (id) =>
      run(() => {
        const goal = store.goals.find((candidate) => candidate.id === id);
        if (!goal) throw notFound('That giving goal');
        return copy(goal);
      }),

    getFundsBreakdown: () => run(() => copy(store.fundsBreakdown)),

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
  };
}

/** The shared instance the app uses. Tests create their own with createMockAdapter(). */
export const mockAdapter: ApiClient = createMockAdapter();
