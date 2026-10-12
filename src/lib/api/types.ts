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
  HelpdeskTopic,
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
}

export interface DonationResult {
  donationId: string;
  status: 'succeeded' | 'pending' | 'failed';
  receiptUrl?: string;
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

/* ---------- Auth (donation gate only) ---------- */

export interface Session {
  userId: string;
  name: string;
  email: string;
}
