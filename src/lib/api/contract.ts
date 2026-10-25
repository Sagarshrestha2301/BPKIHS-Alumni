/**
 * The API contract: every call the UI can make. The HTTP adapter and the server-side
 * adapter both implement it, so components never know how the data is fetched.
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
  ResendRegistrationCodeInput,
  RsvpInput,
  SignupInput,
  VerifyRegistrationInput,
} from './schemas';
import type {
  AlumniEvent,
  AlumniFilterOptions,
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
  /** Null when the Association has not published a welcome message yet. */
  getWelcomeMessage(): Promise<WelcomeMessage | null>;

  /* alumni */
  listAlumni(params?: AlumniListParams): Promise<Paginated<Alumnus>>;
  getAlumnus(id: string): Promise<Alumnus>;
  /** Countries and batch years that exist among listed alumni, for the filter menus. */
  getAlumniFilterOptions(): Promise<AlumniFilterOptions>;
  submitRegistration(input: RegistrationInput): Promise<RegistrationResult>;
  /** Confirms the emailed code and signs the new member in. */
  verifyRegistration(input: VerifyRegistrationInput): Promise<Session>;
  /** Sends a fresh code. Always resolves, so it cannot be used to probe addresses. */
  resendRegistrationCode(input: ResendRegistrationCodeInput): Promise<OkResult>;

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

  /* auth */
  getSession(): Promise<Session | null>;
  login(input: LoginInput): Promise<Session>;
  signup(input: SignupInput): Promise<Session>;
  logout(): Promise<OkResult>;
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
  getAlumniFilterOptions: true,
  submitRegistration: true,
  verifyRegistration: true,
  resendRegistrationCode: true,
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
  getSession: true,
  login: true,
  signup: true,
  logout: true,
};

export const API_METHOD_NAMES = Object.keys(METHODS) as (keyof ApiClient)[];
