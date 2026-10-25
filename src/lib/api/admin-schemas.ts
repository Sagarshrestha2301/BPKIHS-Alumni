/**
 * Validation for the admin content API. These schemas are the single source of truth: the
 * admin forms import their input types from here, and the route handlers parse with them.
 */
import { z } from 'zod';

import {
  EVENT_MODES,
  EVENT_STATUSES,
  NEWSLETTER_BODY_MAX_LENGTH,
  NEWSLETTER_SUBJECT_MAX_LENGTH,
} from '@/lib/constants/domain';

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
  author: requiredText('Enter the author name.', 100),
  role: requiredText('Enter the author role.', 80),
  text: z.string().trim().min(20, 'Write at least 20 characters.').max(1500, TOO_LONG),
  videoUrl: assetUrl,
  photoUrl: assetUrl,
});
export type AdminWelcomeInput = z.infer<typeof adminWelcomeInputSchema>;

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
