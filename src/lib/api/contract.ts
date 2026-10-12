/**
 * The API contract: every call the UI can make. Both adapters (mock now, http later)
 * implement this interface, so components never know which one is running.
 * Input types come from the Zod schemas; result types from ./types.
 */
import type {
  DonationInput,
  HelpdeskInput,
  LoginInput,
  MemberPostInput,
  NewsletterPrefsInput,
  NewsletterSubscribeInput,
  PostReportInput,
  RegistrationInput,
  RsvpInput,
  SignupInput,
} from './schemas';
import type {
  AlumniEvent,
  AlumniListParams,
  Alumnus,
  BoardMember,
  DonationGoal,
  DonationResult,
  EventListParams,
  FaqItem,
  FeedListParams,
  FeedPost,
  FundsBreakdownItem,
  OkResult,
  Paginated,
  PostSubmissionResult,
  RegistrationResult,
  Session,
  SiteStats,
  TicketResult,
  WelcomeMessage,
} from './types';

export interface ApiClient {
  /* site */
  getSiteStats(): Promise<SiteStats>;
  getWelcomeMessage(): Promise<WelcomeMessage>;

  /* alumni */
  listAlumni(params?: AlumniListParams): Promise<Paginated<Alumnus>>;
  getAlumnus(id: string): Promise<Alumnus>;
  submitRegistration(input: RegistrationInput): Promise<RegistrationResult>;

  /* donations */
  listGoals(): Promise<DonationGoal[]>;
  getGoal(id: string): Promise<DonationGoal>;
  createDonation(input: DonationInput): Promise<DonationResult>;
  getFundsBreakdown(): Promise<FundsBreakdownItem[]>;

  /* governance */
  listBoard(params: { current: boolean }): Promise<BoardMember[]>;

  /* events */
  listEvents(params?: EventListParams): Promise<Paginated<AlumniEvent>>;
  getEvent(slug: string): Promise<AlumniEvent>;
  submitRsvp(eventId: string, input: RsvpInput): Promise<OkResult>;

  /* community */
  listFeed(params?: FeedListParams): Promise<Paginated<FeedPost>>;
  submitPost(input: MemberPostInput): Promise<PostSubmissionResult>;
  reportPost(postId: string, input: PostReportInput): Promise<OkResult>;
  subscribeNewsletter(input: NewsletterSubscribeInput): Promise<OkResult>;
  updateNewsletterPrefs(input: NewsletterPrefsInput): Promise<OkResult>;

  /* support */
  listFaq(): Promise<FaqItem[]>;
  submitSupportTicket(input: HelpdeskInput): Promise<TicketResult>;

  /* auth (donation gate only, decision D3) */
  login(input: LoginInput): Promise<Session>;
  signup(input: SignupInput): Promise<Session>;
}

/**
 * One entry per method. The mapped type makes the compiler fail if a method is added to
 * ApiClient and not listed here (or the other way round).
 */
const METHODS: { [K in keyof ApiClient]: true } = {
  getSiteStats: true,
  getWelcomeMessage: true,
  listAlumni: true,
  getAlumnus: true,
  submitRegistration: true,
  listGoals: true,
  getGoal: true,
  createDonation: true,
  getFundsBreakdown: true,
  listBoard: true,
  listEvents: true,
  getEvent: true,
  submitRsvp: true,
  listFeed: true,
  submitPost: true,
  reportPost: true,
  subscribeNewsletter: true,
  updateNewsletterPrefs: true,
  listFaq: true,
  submitSupportTicket: true,
  login: true,
  signup: true,
};

export const API_METHOD_NAMES = Object.keys(METHODS) as (keyof ApiClient)[];
