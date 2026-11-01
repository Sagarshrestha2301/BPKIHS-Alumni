/**
 * The database is the source of truth for every public and admin screen.
 *
 * Conventions:
 * - ids are text so seeded records keep the ids the frontend already links to.
 * - money is an integer in minor units (paisa), exactly like the API contract.
 * - dates are ISO strings in the API but timestamptz in the database.
 * - every table the API reads has explicit columns; no JSON blobs except where the
 *   shape is genuinely open (tribute details, gateway payloads, event galleries).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import {
  ALUMNI_SOURCES,
  APPROVAL_STATUSES,
  CURRENCY,
  EVENT_MODES,
  EVENT_STATUSES,
  HELPDESK_TOPICS,
  NEWSLETTER_INTERESTS,
  PAYMENT_METHODS,
  POST_TYPES,
  PROGRAMMES,
  RECIPIENT_KINDS,
  REPORT_REASONS,
  TRIBUTE_TYPES,
  USER_ROLES,
  VISIBILITIES,
} from '../../lib/constants/domain';

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const programmeEnum = pgEnum('programme', [...PROGRAMMES]);
export const approvalStatusEnum = pgEnum('approval_status', [...APPROVAL_STATUSES]);
export const visibilityEnum = pgEnum('visibility', [...VISIBILITIES]);
export const alumniSourceEnum = pgEnum('alumni_source', [...ALUMNI_SOURCES]);
export const paymentMethodEnum = pgEnum('payment_method', [...PAYMENT_METHODS]);
export const donationStatusEnum = pgEnum('donation_status', ['pending', 'succeeded', 'failed']);
export const eventModeEnum = pgEnum('event_mode', [...EVENT_MODES]);
export const eventStatusEnum = pgEnum('event_status', [...EVENT_STATUSES]);
export const postTypeEnum = pgEnum('post_type', [...POST_TYPES]);

/* The member_post_type SQL enum still contains 'notice', which migration 0000 created,
   because Postgres cannot drop an enum value. It stays a declaration only: no column uses
   it, and new member submissions are validated against MEMBER_POST_TYPES instead, which
   no longer lets members submit notices (notices are issued by the office only). */
const DB_LEGACY_MEMBER_POST_TYPES = ['story', 'achievement', 'notice', 'in_memoriam'] as const;
export const memberPostTypeEnum = pgEnum('member_post_type', [...DB_LEGACY_MEMBER_POST_TYPES]);
export const helpdeskTopicEnum = pgEnum('helpdesk_topic', [...HELPDESK_TOPICS]);
export const newsletterInterestEnum = pgEnum('newsletter_interest', [...NEWSLETTER_INTERESTS]);
export const reportReasonEnum = pgEnum('report_reason', [...REPORT_REASONS]);
export const reportStatusEnum = pgEnum('report_status', ['open', 'reviewed', 'dismissed']);
export const rsvpStatusEnum = pgEnum('rsvp_status', ['confirmed', 'waitlist']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'closed']);
/** `pending` is an address that asked to join but has not opened the confirmation email yet. */
export const subscriberStatusEnum = pgEnum('subscriber_status', [
  'subscribed',
  'unsubscribed',
  'pending',
]);
export const campaignStatusEnum = pgEnum('campaign_status', ['sending', 'sent', 'failed']);
export const tributeTypeEnum = pgEnum('tribute_type', [...TRIBUTE_TYPES]);
export const recipientKindEnum = pgEnum('recipient_kind', [...RECIPIENT_KINDS]);
export const userRoleEnum = pgEnum('user_role', [...USER_ROLES]);
export const paymentGatewayEnum = pgEnum('payment_gateway', [
  'esewa',
  'khalti',
  'connectips',
  'fonepay',
  'card',
  'paypal',
]);

/* ------------------------------------------------------------------ */
/* Better Auth                                                        */
/* ------------------------------------------------------------------ */

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('donor'),
    /** Set by the two-factor plugin once an authenticator app confirms a TOTP code. */
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    banned: boolean('banned').notNull().default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('user_email_unique').on(table.email)],
);

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => [
    uniqueIndex('session_token_unique').on(table.token),
    index('session_user_id_idx').on(table.userId),
  ],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/**
 * Better Auth's two-factor plugin stores the encrypted TOTP secret and the hashed backup
 * codes here. The secret is encrypted with `BETTER_AUTH_SECRET`, so a database dump alone
 * does not let someone generate valid codes.
 */
export const twoFactor = pgTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean('verified').notNull().default(true),
    failedVerificationCount: integer('failed_verification_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
  },
  (table) => [
    index('two_factor_user_id_idx').on(table.userId),
    index('two_factor_secret_idx').on(table.secret),
  ],
);

/* ------------------------------------------------------------------ */
/* Alumni                                                             */
/* ------------------------------------------------------------------ */

export const alumni = pgTable(
  'alumni',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    programme: programmeEnum('programme').notNull(),
    batchYear: integer('batch_year').notNull(),
    furtherStudies: text('further_studies'),
    currentPosition: text('current_position'),
    organisation: text('organisation'),
    city: text('city'),
    country: text('country').notNull(),
    note: text('note'),
    photoUrl: text('photo_url'),
    /**
     * Explicit agreement to publish an uploaded photo in the directory. The photo is never
     * shown without it, and removing the photo clears it again.
     */
    photoConsent: boolean('photo_consent').notNull().default(false),
    /**
     * Professional areas the member claims, displayed as tags on the directory profile. Kept
     * as a string array so the directory can search it without a join table; the API caps the
     * number and length of entries.
     */
    expertise: text('expertise')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    privacyEmail: visibilityEnum('privacy_email').notNull().default('hidden'),
    privacyPhone: visibilityEnum('privacy_phone').notNull().default('hidden'),
    privacyProfile: visibilityEnum('privacy_profile').notNull().default('public'),
    status: approvalStatusEnum('status').notNull().default('pending'),
    source: alumniSourceEnum('source').notNull().default('self_registered'),
    placeholder: boolean('placeholder').notNull().default(false),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('alumni_status_idx').on(table.status),
    index('alumni_programme_idx').on(table.programme),
    index('alumni_batch_year_idx').on(table.batchYear),
    index('alumni_country_idx').on(table.country),
    index('alumni_name_idx').on(table.fullName),
  ],
);

/* ------------------------------------------------------------------ */
/* Donations                                                          */
/* ------------------------------------------------------------------ */

/**
 * Narrative progress updates the Association publishes on a giving goal's detail page, so
 * donors can follow the work between the numbers. Rows are flat text on purpose: no title
 * hierarchy, just dated entries the office writes as the work proceeds.
 */
export const donationGoalUpdates = pgTable('donation_goal_updates', {
  id: text('id').primaryKey(),
  goalId: text('goal_id')
    .notNull()
    .references(() => donationGoals.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const donationGoals = pgTable('donation_goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  targetMinor: bigint('target_minor', { mode: 'number' }).notNull(),
  raisedMinor: bigint('raised_minor', { mode: 'number' }).notNull().default(0),
  currency: text('currency').notNull().default(CURRENCY),
  deadline: timestamp('deadline', { withTimezone: true }),
  imageUrl: text('image_url'),
  placeholder: boolean('placeholder').notNull().default(false),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export interface TributeDetails {
  type: 'in_honour' | 'in_memory';
  recipientKind: 'batch' | 'mentor' | 'alumnus';
  name: string;
  message?: string;
  notifyEmail?: string;
}

export const donations = pgTable(
  'donations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    goalId: text('goal_id').references(() => donationGoals.id, { onDelete: 'set null' }),
    eventId: text('event_id'),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    currency: text('currency').notNull().default(CURRENCY),
    method: paymentMethodEnum('method').notNull(),
    status: donationStatusEnum('status').notNull().default('pending'),
    anonymous: boolean('anonymous').notNull().default(false),
    tribute: jsonb('tribute').$type<TributeDetails>(),
    gateway: paymentGatewayEnum('gateway'),
    /**
     * Short reference we send to the gateway when the payment starts. ConnectIPS requires its
     * `TXNID` to be at most 20 characters, so the 36-character donation id cannot be used; its
     * return carries only `?TXNID=`, and the adapter resolves the donation with this value.
     */
    gatewayOrderRef: text('gateway_order_ref'),
    gatewayRef: text('gateway_ref'),
    gatewayPayload: jsonb('gateway_payload').$type<Record<string, unknown>>(),
    receiptSentAt: timestamp('receipt_sent_at', { withTimezone: true }),
    /** Set only when a verified gateway callback changes this gift to succeeded. */
    succeededAt: timestamp('succeeded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('donations_user_idx').on(table.userId),
    index('donations_goal_idx').on(table.goalId),
    index('donations_status_idx').on(table.status),
    index('donations_succeeded_at_idx').on(table.status, table.succeededAt),
    index('donations_created_idx').on(table.createdAt),
    uniqueIndex('donations_gateway_ref_unique').on(table.gateway, table.gatewayRef),
    uniqueIndex('donations_gateway_order_ref_unique').on(table.gateway, table.gatewayOrderRef),
  ],
);

export const paymentEvents = pgTable(
  'payment_events',
  {
    id: text('id').primaryKey(),
    donationId: text('donation_id').references(() => donations.id, { onDelete: 'cascade' }),
    gateway: paymentGatewayEnum('gateway').notNull(),
    eventType: text('event_type').notNull(),
    externalId: text('external_id'),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('payment_events_gateway_external_unique').on(table.gateway, table.externalId),
    index('payment_events_donation_idx').on(table.donationId),
  ],
);

export const gatewayCheckStatusEnum = pgEnum('gateway_check_status', [
  'passed',
  'failed',
  'blocked',
]);

/**
 * The last integration check per gateway, shown on the admin Payments page. One row per
 * gateway: this is a status light, not a history. The acceptance script overwrites it on every
 * run, so "when" is always the most recent attempt.
 */
export const gatewayChecks = pgTable('gateway_checks', {
  gateway: paymentGatewayEnum('gateway').primaryKey(),
  status: gatewayCheckStatusEnum('status').notNull(),
  /** Payment mode at the time of the check, or `unset` when it was blocked early. */
  mode: text('mode').notNull(),
  detail: text('detail').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fundsBreakdown = pgTable('funds_breakdown', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  sharePercent: integer('share_percent').notNull(),
  period: text('period').notNull().default('current'),
  sortOrder: integer('sort_order').notNull().default(0),
});

/* ------------------------------------------------------------------ */
/* Governance                                                         */
/* ------------------------------------------------------------------ */

export const boardMembers = pgTable('board_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  term: text('term').notNull(),
  batch: text('batch'),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  visionStatement: text('vision_statement'),
  isCurrent: boolean('is_current').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  placeholder: boolean('placeholder').notNull().default(false),
});

/* ------------------------------------------------------------------ */
/* Events                                                             */
/* ------------------------------------------------------------------ */

export interface EventGalleryItem {
  type: 'photo' | 'video';
  url: string;
  alt: string;
}

export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    description: text('description').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    venue: text('venue').notNull(),
    city: text('city').notNull(),
    mode: eventModeEnum('mode').notNull().default('in_person'),
    capacity: integer('capacity'),
    /** Attendance imported with past events; live RSVP guests are added on top. */
    baseRsvpCount: integer('base_rsvp_count').notNull().default(0),
    imageUrl: text('image_url'),
    status: eventStatusEnum('status').notNull().default('upcoming'),
    goalId: text('goal_id').references(() => donationGoals.id, { onDelete: 'set null' }),
    gallery: jsonb('gallery').$type<EventGalleryItem[]>(),
    placeholder: boolean('placeholder').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('events_slug_unique').on(table.slug),
    index('events_status_idx').on(table.status),
    index('events_starts_at_idx').on(table.startsAt),
  ],
);

export const eventRsvps = pgTable(
  'event_rsvps',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    guests: integer('guests').notNull().default(1),
    status: rsvpStatusEnum('status').notNull().default('confirmed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('event_rsvps_event_idx').on(table.eventId),
    uniqueIndex('event_rsvps_event_email_unique').on(table.eventId, table.email),
  ],
);

/* ------------------------------------------------------------------ */
/* Community                                                          */
/* ------------------------------------------------------------------ */

export const feedPosts = pgTable(
  'feed_posts',
  {
    id: text('id').primaryKey(),
    type: postTypeEnum('type').notNull(),
    status: approvalStatusEnum('status').notNull().default('pending'),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull(),
    body: text('body').notNull(),
    author: text('author').notNull(),
    authorEmail: text('author_email'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    imageUrl: text('image_url'),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    placeholder: boolean('placeholder').notNull().default(false),
    reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('feed_posts_status_idx').on(table.status),
    index('feed_posts_type_idx').on(table.type),
    index('feed_posts_published_idx').on(table.publishedAt),
  ],
);

export const postReports = pgTable(
  'post_reports',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => feedPosts.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum('reason').notNull(),
    details: text('details'),
    status: reportStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [index('post_reports_status_idx').on(table.status)],
);

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    interests: newsletterInterestEnum('interests')
      .array()
      .notNull()
      .default(sql`'{}'::newsletter_interest[]`),
    /**
     * The service always writes the status explicitly; `subscribeNewsletter` writes `pending`.
     * The default stays on an existing enum value because Drizzle applies migrations in one
     * transaction, and PostgreSQL forbids using a value added by that same transaction.
     */
    status: subscriberStatusEnum('status').notNull().default('subscribed'),
    token: text('token').notNull(),
    /**
     * When the provider accepted the confirmation email; null while none has gone out. A
     * failed send leaves it null, so the next attempt is allowed immediately rather than
     * waiting for the resend window.
     */
    confirmationSentAt: timestamp('confirmation_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('newsletter_email_unique').on(table.email),
    uniqueIndex('newsletter_token_unique').on(table.token),
  ],
);

/* ------------------------------------------------------------------ */
/* Support and content                                                */
/* ------------------------------------------------------------------ */

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    topic: helpdeskTopicEnum('topic').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: ticketStatusEnum('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('support_tickets_reference_unique').on(table.reference),
    index('support_tickets_status_idx').on(table.status),
  ],
);

export const faqItems = pgTable('faq_items', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  placeholder: boolean('placeholder').notNull().default(false),
});

export const welcomeMessage = pgTable('welcome_message', {
  id: text('id').primaryKey().default('default'),
  author: text('author').notNull(),
  role: text('role').notNull(),
  text: text('text').notNull(),
  videoUrl: text('video_url'),
  photoUrl: text('photo_url'),
  placeholder: boolean('placeholder').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterCampaigns = pgTable(
  'newsletter_campaigns',
  {
    id: text('id').primaryKey(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    status: campaignStatusEnum('status').notNull().default('sending'),
    recipientCount: integer('recipient_count').notNull().default(0),
    sentCount: integer('sent_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (table) => [index('newsletter_campaigns_created_idx').on(table.createdAt)],
);

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    detail: jsonb('detail').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('admin_audit_created_idx').on(table.createdAt)],
);
