/**
 * Data shapes the backend must later match (CONTEXT.md section 7.1).
 * All ids are strings; dates are ISO 8601 strings; money is integer minor units (paisa).
 * Input types (what forms submit) are inferred from the Zod schemas in ./schemas.ts.
 */
import type {
  AlumniSource,
  ApprovalStatus,
  Currency,
  EventMode,
  EventStatus,
  PostType,
  Programme,
  Visibility,
} from '@/lib/constants/domain';

export type {
  AlumniSource,
  ApprovalStatus,
  Currency,
  EventMode,
  EventStatus,
  HelpdeskTopic,
  MemberPostType,
  NewsletterInterest,
  PaymentMethod,
  PostType,
  Programme,
  RecipientKind,
  ReportReason,
  TributeType,
  Visibility,
} from '@/lib/constants/domain';

/* ---------- Alumni ---------- */

export interface AlumniPrivacy {
  email: Visibility;
  phone: Visibility;
  profile: Visibility;
}

export interface Alumnus {
  id: string;
  fullName: string;
  programme: Programme;
  /** Graduation or batch year. */
  batchYear: number;
  furtherStudies?: string;
  currentPosition?: string;
  organisation?: string;
  city?: string;
  country: string;
  note?: string;
  photoUrl?: string;
  /** Professional areas the member chose to show, at most eight. */
  expertise?: string[];
  /** Present only when the privacy setting allows the viewer to see it. */
  email?: string;
  /** Present only when the privacy setting allows the viewer to see it. */
  phone?: string;
  privacy: AlumniPrivacy;
  status: ApprovalStatus;
  /** The written register arrives later by CSV import. */
  source: AlumniSource;
  placeholder?: boolean;
  createdAt: string;
}

/**
 * The signed-in member's own record: the public profile plus the review note only they and the
 * Association may read. Public directory endpoints keep returning `Alumnus`.
 */
export interface OwnAlumnus extends Alumnus {
  rejectionReason?: string;
  /** Whether the member has agreed to their uploaded photo being published. */
  photoConsent: boolean;
}

/** What the member chose to upload, kept as a browser File until the request is made. */
export interface ProfilePhotoUpload {
  file: File;
  consent: boolean;
}

/** The state of the member's photo after an upload or a removal. */
export interface ProfilePhotoResult {
  photoUrl?: string;
  photoConsent: boolean;
}

/* ---------- Donations ---------- */

export interface DonationGoal {
  id: string;
  title: string;
  description: string;
  targetMinor: number;
  raisedMinor: number;
  currency: Currency;
  deadline?: string;
  imageUrl?: string;
  placeholder?: boolean;
}

export interface FundsBreakdownItem {
  category: string;
  sharePercent: number;
  amountMinor: number;
}

/**
 * One dated progress update the Association publishes on a goal's own page. Public text
 * only: the editor's id and the actor are admin data, never shown next to the narrative.
 */
export interface GoalUpdate {
  id: string;
  goalId: string;
  body: string;
  createdAt: string;
}

/**
 * One confirmed gift on the public transparency page.
 *
 * This shape is deliberately small: no donor id, no email and no amount. `name` is omitted at
 * the source when the donor gave anonymously, so the address never leaves the server.
 */
export interface PublicDonor {
  name?: string;
  goalTitle?: string;
  givenAt: string;
}

/* ---------- Governance ---------- */

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  term: string;
  batch?: string;
  photoUrl?: string;
  bio?: string;
  visionStatement?: string;
  isCurrent: boolean;
  placeholder?: boolean;
}

/* ---------- Events ---------- */

export interface EventGalleryItem {
  type: 'photo' | 'video';
  url: string;
  alt: string;
}

export interface AlumniEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  city: string;
  mode: EventMode;
  capacity?: number;
  rsvpCount: number;
  imageUrl?: string;
  status: EventStatus;
  /** Linked donation drive. */
  goalId?: string;
  /** Past events only. */
  gallery?: EventGalleryItem[];
  placeholder?: boolean;
}

/* ---------- Community ---------- */

export interface FeedPost {
  id: string;
  type: PostType;
  /** Member posts are moderated before they appear. */
  status: ApprovalStatus;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  placeholder?: boolean;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  placeholder?: boolean;
}

export interface WelcomeMessage {
  author: string;
  role: string;
  text: string;
  videoUrl?: string;
  photoUrl?: string;
  placeholder?: boolean;
}

export interface SiteStats {
  alumniCount: number;
  raisedMinor: number;
  activeProgrammes: number;
  countries?: number;
  eventsHeld?: number;
}

/* ---------- Lists ---------- */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListParams {
  /** 1-based. */
  page?: number;
  pageSize?: number;
  /** Free-text search. */
  q?: string;
}

export type AlumniSort = 'name' | 'batch_newest' | 'batch_oldest' | 'recently_joined';

export interface AlumniListParams extends ListParams {
  sort?: AlumniSort;
  programme?: Programme;
  batchYear?: number;
  country?: string;
  city?: string;
  furtherStudies?: boolean;
}

/** What the directory filter menus offer. Built only from listed profiles. */
export interface AlumniFilterOptions {
  countries: string[];
  /** Newest first. */
  batchYears: number[];
}

export type EventSort = 'soonest' | 'latest';

export interface EventListParams extends ListParams {
  status?: EventStatus;
  sort?: EventSort;
}

export interface FeedListParams extends ListParams {
  type?: PostType;
  tag?: string;
}

/* ---------- Results of write actions ---------- */

export interface RegistrationResult {
  id: string;
  status: 'pending';
  /** Where the verification code was sent, so the form can name the address. */
  email: string;
}

export interface DonationResult {
  donationId: string;
  status: 'succeeded' | 'pending' | 'failed';
  receiptUrl?: string;
  /** Present when a real gateway needs the browser to continue the payment. */
  redirect?: {
    url: string;
    method: 'GET' | 'POST';
    fields?: Record<string, string>;
  };
}

export interface PostSubmissionResult {
  id: string;
  status: 'pending';
}

export interface TicketResult {
  ticketId: string;
}

export interface OkResult {
  ok: true;
}

/**
 * The answer to a newsletter subscribe. `confirmationEmailSent` is false only when a
 * confirmation email was needed and the provider refused it, so the form can say so instead of
 * pointing the visitor at an inbox nothing will arrive in.
 *
 * An address that is already confirmed needs no email and answers true: the flag must not
 * become a way to test whether an address is on the list.
 */
export interface NewsletterSubscribeResult {
  ok: true;
  confirmationEmailSent: boolean;
}

/* ---------- Auth ---------- */
export interface Session {
  userId: string;
  name: string;
  email: string;
}
