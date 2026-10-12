/** Value lists shared by the types, the Zod schemas and (later) the UI. Single source of truth. */

export const PROGRAMMES = [
  'MBBS',
  'BDS',
  'BMIT',
  'BSc Nursing',
  'Allied Health',
  'MD/MS',
  'MSc',
  'MDS',
  'DM/MCh',
  'PhD',
  'Fellowship',
] as const;
export type Programme = (typeof PROGRAMMES)[number];

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const VISIBILITIES = ['public', 'alumni_only', 'hidden'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const ALUMNI_SOURCES = ['self_registered', 'csv_import'] as const;
export type AlumniSource = (typeof ALUMNI_SOURCES)[number];

/** NPR only (decision D30). Amounts are integers in minor units (paisa). */
export const CURRENCY = 'NPR' as const;
export type Currency = typeof CURRENCY;

export const PAYMENT_METHODS = [
  'esewa',
  'khalti',
  'connectips',
  'fonepay',
  'card',
  'paypal',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRIBUTE_TYPES = ['in_honour', 'in_memory'] as const;
export type TributeType = (typeof TRIBUTE_TYPES)[number];

export const RECIPIENT_KINDS = ['batch', 'mentor', 'alumnus'] as const;
export type RecipientKind = (typeof RECIPIENT_KINDS)[number];

export const EVENT_MODES = ['in_person', 'online', 'hybrid'] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export const EVENT_STATUSES = ['upcoming', 'past'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const POST_TYPES = [
  'news',
  'story',
  'notice',
  'achievement',
  'event',
  'announcement',
  'in_memoriam',
] as const;
export type PostType = (typeof POST_TYPES)[number];

/** Post types a member may submit. News, event and announcement are staff-only. */
export const MEMBER_POST_TYPES = ['story', 'achievement', 'notice', 'in_memoriam'] as const;
export type MemberPostType = (typeof MEMBER_POST_TYPES)[number];

export const HELPDESK_TOPICS = [
  'account',
  'profile_verification',
  'donation_receipt',
  'general',
] as const;
export type HelpdeskTopic = (typeof HELPDESK_TOPICS)[number];

export const NEWSLETTER_INTERESTS = ['news', 'events', 'giving', 'stories'] as const;
export type NewsletterInterest = (typeof NEWSLETTER_INTERESTS)[number];

export const REPORT_REASONS = ['inappropriate', 'inaccurate', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Smallest and largest single gift, in paisa (NPR 100 and NPR 10,000,000). */
export const MIN_DONATION_MINOR = 10_000;
export const MAX_DONATION_MINOR = 1_000_000_000;

/** Loose lower bound for batch years; the upper bound is checked against today's year. */
export const MIN_BATCH_YEAR = 1990;

/** Same pattern the newsletter form already uses. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits, spaces and hyphens, with an optional leading +. Deliberately permissive (international). */
export const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,17}$/;
