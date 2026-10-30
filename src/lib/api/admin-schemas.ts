/**
 * Validation for the admin content API. These schemas are the single source of truth: the
 * admin forms import their input types from here, and the route handlers parse with them.
 */
import { z } from 'zod';

import {
  EMAIL_PATTERN,
  EVENT_MODES,
  EVENT_STATUSES,
  MIN_BATCH_YEAR,
  NEWSLETTER_BODY_MAX_LENGTH,
  NEWSLETTER_SUBJECT_MAX_LENGTH,
  PHONE_PATTERN,
  POST_TYPES,
  PROGRAMMES,
} from '@/lib/constants/domain';

import { IMPORT_MAX_BYTES } from './alumni-import';

const TOO_LONG = 'That is too long. Please shorten it.';

const requiredText = (message: string, max = 120) =>
  z.string().trim().min(1, message).max(max, TOO_LONG);

const optionalText = (max = 200) => z.string().trim().max(max, TOO_LONG).optional();

const isoDateTime = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date and time.');

/** Accepts an absolute HTTPS URL or a site-relative path (for images shipped with the site). */
const assetUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === '' ||
      (value.startsWith('/') && !value.startsWith('//')) ||
      value.startsWith('https://'),
    'Use an https:// URL or a path beginning with /.',
  )
  .optional();

const slug = z
  .string()
  .trim()
  .min(3, 'Use at least 3 characters.')
  .max(80, TOO_LONG)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lower-case words joined by hyphens.');

export const adminEventInputSchema = z
  .object({
    slug,
    title: requiredText('Enter a title.', 120),
    summary: requiredText('Enter a short summary.', 250),
    description: z.string().trim().min(20, 'Write at least 20 characters.').max(5000, TOO_LONG),
    startsAt: isoDateTime,
    endsAt: isoDateTime.optional(),
    venue: requiredText('Enter a venue.', 120),
    city: requiredText('Enter a city.', 80),
    mode: z.enum(EVENT_MODES),
    capacity: z.number().int().min(1).max(100_000).optional(),
    imageUrl: assetUrl,
    status: z.enum(EVENT_STATUSES),
    goalId: z.string().trim().min(1).max(120).optional(),
    gallery: z
      .array(
        z.object({
          type: z.enum(['photo', 'video']),
          url: z
            .string()
            .trim()
            .min(1)
            .max(500)
            .refine((value) => value.startsWith('https://'), 'Gallery links must use https://.'),
          alt: requiredText('Describe the gallery item.', 200),
        }),
      )
      .max(24)
      .optional(),
  })
  .refine(
    (value) => !value.endsAt || Date.parse(value.endsAt) >= Date.parse(value.startsAt),
    'The end must not be before the start.',
  );
export type AdminEventInput = z.infer<typeof adminEventInputSchema>;

export const adminGoalInputSchema = z.object({
  title: requiredText('Enter a title.', 100),
  description: z.string().trim().min(10, 'Write at least 10 characters.').max(500, TOO_LONG),
  targetMinor: z.number().int().min(1_000).max(1_000_000_000),
  raisedMinor: z.number().int().min(0).max(1_000_000_000).optional(),
  deadline: isoDateTime.optional(),
  imageUrl: assetUrl,
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000),
});
export type AdminGoalInput = z.infer<typeof adminGoalInputSchema>;

export const adminBoardInputSchema = z.object({
  name: requiredText('Enter a name.', 100),
  role: requiredText('Enter a role.', 80),
  term: requiredText('Enter a term, for example 2024–2026.', 40),
  batch: optionalText(60),
  photoUrl: assetUrl,
  bio: optionalText(600),
  visionStatement: optionalText(500),
  isCurrent: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000),
});
export type AdminBoardInput = z.infer<typeof adminBoardInputSchema>;

export const adminFaqInputSchema = z.object({
  category: requiredText('Enter a category.', 40),
  question: requiredText('Enter the question.', 200),
  answer: z.string().trim().min(10, 'Write at least 10 characters.').max(1500, TOO_LONG),
  sortOrder: z.number().int().min(0).max(10_000),
});
export type AdminFaqInput = z.infer<typeof adminFaqInputSchema>;

export const adminWelcomeInputSchema = z.object({
  author: requiredText('Enter the author.', 120),
  role: requiredText('Enter the author role.', 120),
  text: z.string().trim().min(20, 'Write at least 20 characters.').max(4000, TOO_LONG),
  videoUrl: assetUrl,
  photoUrl: assetUrl,
});
export type AdminWelcomeInput = z.infer<typeof adminWelcomeInputSchema>;

export const adminFundInputSchema = z.object({
  category: requiredText('Enter a category.', 100),
  sharePercent: z
    .number('Enter a share between 1 and 100.')
    .int('Enter a whole percentage.')
    .min(1, 'Enter a share between 1 and 100.')
    .max(100, 'Enter a share between 1 and 100.'),
  period: optionalText(40),
  sortOrder: z.number().int().min(0).max(10_000),
});
export type AdminFundInput = z.infer<typeof adminFundInputSchema>;

export const adminPostInputSchema = z.object({
  type: z.enum(POST_TYPES),
  title: z.string().trim().min(5, 'Enter a title of at least 5 characters.').max(120, TOO_LONG),
  body: z.string().trim().min(20, 'Write at least 20 characters.').max(5000, TOO_LONG),
  author: requiredText('Enter the byline.', 100),
  imageUrl: assetUrl,
});
export type AdminPostInput = z.infer<typeof adminPostInputSchema>;

/* ---------- register import ---------- */

/** One mapped CSV row. The programme is normalised before this runs. */
export const alumniImportRowSchema = z.object({
  fullName: requiredText('Enter the full name.', 100),
  email: z.string().trim().toLowerCase().regex(EMAIL_PATTERN, 'Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, 'Enter a valid phone number.')
    .or(z.literal(''))
    .optional(),
  programme: z.enum(PROGRAMMES),
  batchYear: z
    .number('Enter the batch year, for example 2012.')
    .int('Enter a whole batch year.')
    .min(MIN_BATCH_YEAR, `Enter a year from ${MIN_BATCH_YEAR} onwards.`)
    .refine((year) => year <= new Date().getFullYear() + 1, 'That year is too far ahead.'),
  furtherStudies: optionalText(150),
  currentPosition: optionalText(120),
  organisation: optionalText(120),
  city: optionalText(80),
  country: requiredText('Enter the country.', 80),
  note: optionalText(500),
});
export type AlumniImportRow = z.infer<typeof alumniImportRowSchema>;

const importColumn = z.number().int().min(0).max(200).nullable();

/** Every field is present; null means the column is not mapped. */
export const alumniImportMappingSchema = z.object({
  fullName: importColumn,
  email: importColumn,
  programme: importColumn,
  batchYear: importColumn,
  country: importColumn,
  phone: importColumn,
  city: importColumn,
  currentPosition: importColumn,
  organisation: importColumn,
  furtherStudies: importColumn,
  note: importColumn,
});
export type AlumniImportMapping = z.infer<typeof alumniImportMappingSchema>;

export const alumniImportRequestSchema = z.object({
  csv: z.string().min(1, 'Choose a CSV file.').max(IMPORT_MAX_BYTES, 'That file is too large.'),
  mapping: alumniImportMappingSchema,
  dryRun: z.boolean(),
  /**
   * Whether the imported profiles may appear in the directory immediately. Off by default:
   * a register row has not agreed to publication, so it waits for review or a claim.
   */
  publish: z.boolean().default(false),
  filename: z.string().trim().max(200).optional(),
});
export type AlumniImportRequest = z.infer<typeof alumniImportRequestSchema>;

export const newsletterCampaignInputSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, 'Enter a subject.')
    .max(NEWSLETTER_SUBJECT_MAX_LENGTH, TOO_LONG),
  body: z
    .string()
    .trim()
    .min(20, 'Write at least 20 characters.')
    .max(NEWSLETTER_BODY_MAX_LENGTH, TOO_LONG),
  /** When set, the campaign is sent only to this address and no campaign row is recorded. */
  testEmail: z.string().trim().toLowerCase().email('Enter a valid email address.').optional(),
});
export type NewsletterCampaignInput = z.infer<typeof newsletterCampaignInputSchema>;
