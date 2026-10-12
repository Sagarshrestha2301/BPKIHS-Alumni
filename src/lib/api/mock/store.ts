/** In-memory state for one adapter instance. Starts as a deep copy of the seeds. */
import type {
  AlumniEvent,
  Alumnus,
  BoardMember,
  DonationGoal,
  FaqItem,
  FeedPost,
  FundsBreakdownItem,
  WelcomeMessage,
} from '../types';
import { alumniSeed } from './data/alumni';
import { boardSeed } from './data/board';
import { eventsSeed } from './data/events';
import { faqSeed } from './data/faq';
import { fundsBreakdownSeed, goalsSeed } from './data/goals';
import { postsSeed } from './data/posts';
import { welcomeSeed } from './data/welcome';

export interface MockStore {
  alumni: Alumnus[];
  goals: DonationGoal[];
  fundsBreakdown: FundsBreakdownItem[];
  board: BoardMember[];
  events: AlumniEvent[];
  posts: FeedPost[];
  faq: FaqItem[];
  welcome: WelcomeMessage;
  /** Filled in by the write methods (step 3e-2). */
  counters: Record<string, number>;
}

export function createStore(): MockStore {
  return structuredClone({
    alumni: alumniSeed,
    goals: goalsSeed,
    fundsBreakdown: fundsBreakdownSeed,
    board: boardSeed,
    events: eventsSeed,
    posts: postsSeed,
    faq: faqSeed,
    welcome: welcomeSeed,
    counters: {},
  });
}
