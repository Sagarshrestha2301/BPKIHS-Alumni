/** In-memory state for one adapter instance. Starts as a deep copy of the seeds. */
import type { TributeInput } from '../schemas';
import type {
  AlumniEvent,
  Alumnus,
  BoardMember,
  DonationGoal,
  DonationResult,
  FaqItem,
  FeedPost,
  FundsBreakdownItem,
  HelpdeskTopic,
  NewsletterInterest,
  PaymentMethod,
  ReportReason,
  WelcomeMessage,
} from '../types';
import { alumniSeed } from './data/alumni';
import { boardSeed } from './data/board';
import { eventsSeed } from './data/events';
import { faqSeed } from './data/faq';
import { fundsBreakdownSeed, goalsSeed } from './data/goals';
import { postsSeed } from './data/posts';
import { welcomeSeed } from './data/welcome';

export interface DonationRecord {
  id: string;
  goalId: string;
  eventId?: string;
  amountMinor: number;
  method: PaymentMethod;
  anonymous: boolean;
  tribute?: TributeInput;
  status: DonationResult['status'];
  createdAt: string;
}

export interface RsvpRecord {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  partySize: number;
  waitlisted: boolean;
  createdAt: string;
}

export interface PostReportRecord {
  id: string;
  postId: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
}

export interface SubscriberRecord {
  email: string;
  interests: NewsletterInterest[];
  optIn: boolean;
  updatedAt: string;
}

export interface TicketRecord {
  id: string;
  topic: HelpdeskTopic;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface MockStore {
  alumni: Alumnus[];
  goals: DonationGoal[];
  fundsBreakdown: FundsBreakdownItem[];
  board: BoardMember[];
  events: AlumniEvent[];
  posts: FeedPost[];
  faq: FaqItem[];
  welcome: WelcomeMessage;
  /** Written by the write methods. */
  donations: DonationRecord[];
  rsvps: RsvpRecord[];
  reports: PostReportRecord[];
  subscribers: SubscriberRecord[];
  tickets: TicketRecord[];
  users: UserRecord[];
  /** Author contact for member posts, kept off the public post. */
  postAuthorEmails: Record<string, string>;
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
    donations: [],
    rsvps: [],
    reports: [],
    subscribers: [],
    tickets: [],
    /** A demo account so the donation gate can be tried with: demo@example.com */
    users: [
      {
        id: 'user-demo',
        name: 'Demo Donor',
        email: 'demo@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    postAuthorEmails: {},
    counters: {},
  });
}
