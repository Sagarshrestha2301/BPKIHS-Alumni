/**
 * The API contract: every call the UI can make. The HTTP adapter and the server-side
 * adapter both implement it, so components never know how the data is fetched.
 * Input types come from the Zod schemas; result types from ./types.
 */
import type {
  ChangePasswordInput,
  DonationInput,
  ForgotPasswordInput,
  HelpdeskInput,
  LoginInput,
  MemberPostInput,
  NewsletterPrefsInput,
  NewsletterSubscribeInput,
  PostReportInput,
  ProfileUpdateInput,
  RegistrationInput,
  ResendRegistrationCodeInput,
  ResetPasswordInput,
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
  NewsletterSubscribeResult,
  OkResult,
  Paginated,
  PostSubmissionResult,
  ProfilePhotoResult,
  ProfilePhotoUpload,
  PublicDonor,
  RegistrationResult,
  Session,
  SiteStats,
  TicketResult,
  WelcomeMessage,
} from './types';

/**
 * Transport data that is not part of the form's schema. Today that is only the Cloudflare
 * Turnstile token the public forms must present; it travels in a header, not the body.
 */
export interface RequestOptions {
  botToken?: string;
}

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
  submitRegistration(
    input: RegistrationInput,
    options?: RequestOptions,
  ): Promise<RegistrationResult>;
  /** Confirms the emailed code and signs the new member in. */
  verifyRegistration(input: VerifyRegistrationInput): Promise<Session>;
  /** Sends a fresh code. Always resolves, so it cannot be used to probe addresses. */
  resendRegistrationCode(input: ResendRegistrationCodeInput): Promise<OkResult>;

  /* donations */
  listGoals(): Promise<DonationGoal[]>;
  getGoal(id: string): Promise<DonationGoal>;
  createDonation(input: DonationInput): Promise<DonationResult>;
  getFundsBreakdown(): Promise<FundsBreakdownItem[]>;
  /** Confirmed gifts, newest first; `goalId` narrows to one goal. Anonymous donors carry no name. */
  listPublicDonors(params?: {
    page?: number;
    pageSize?: number;
    goalId?: string;
  }): Promise<Paginated<PublicDonor>>;

  /* governance */
  listBoard(params: { current: boolean }): Promise<BoardMember[]>;

  /* events */
  listEvents(params?: EventListParams): Promise<Paginated<AlumniEvent>>;
  getEvent(slug: string): Promise<AlumniEvent>;
  submitRsvp(eventId: string, input: RsvpInput, options?: RequestOptions): Promise<OkResult>;

  /* community */
  listFeed(params?: FeedListParams): Promise<Paginated<FeedPost>>;
  getPost(id: string): Promise<FeedPost>;
  submitPost(input: MemberPostInput): Promise<PostSubmissionResult>;
  reportPost(postId: string, input: PostReportInput): Promise<OkResult>;
  subscribeNewsletter(
    input: NewsletterSubscribeInput,
    options?: RequestOptions,
  ): Promise<NewsletterSubscribeResult>;
  updateNewsletterPrefs(input: NewsletterPrefsInput, options?: RequestOptions): Promise<OkResult>;

  /* support */
  listFaq(): Promise<FaqItem[]>;
  submitSupportTicket(input: HelpdeskInput): Promise<TicketResult>;

  /* account */
  updateMyProfile(input: ProfileUpdateInput): Promise<Alumnus>;
  /** Uploads a new photo after the member agrees to publication. */
  uploadMyPhoto(input: ProfilePhotoUpload): Promise<ProfilePhotoResult>;
  /** Removes the stored photo and withdraws publication consent. */
  removeMyPhoto(): Promise<ProfilePhotoResult>;
  changePassword(input: ChangePasswordInput): Promise<OkResult>;
  /** Emails a reset link when the address has an account; always resolves. */
  requestPasswordReset(input: ForgotPasswordInput): Promise<OkResult>;
  resetPassword(input: ResetPasswordInput): Promise<OkResult>;

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
  listPublicDonors: true,
  listBoard: true,
  listEvents: true,
  getEvent: true,
  submitRsvp: true,
  listFeed: true,
  getPost: true,
  submitPost: true,
  reportPost: true,
  subscribeNewsletter: true,
  updateNewsletterPrefs: true,
  listFaq: true,
  submitSupportTicket: true,
  updateMyProfile: true,
  uploadMyPhoto: true,
  removeMyPhoto: true,
  changePassword: true,
  requestPasswordReset: true,
  resetPassword: true,
  getSession: true,
  login: true,
  signup: true,
  logout: true,
};

export const API_METHOD_NAMES = Object.keys(METHODS) as (keyof ApiClient)[];
