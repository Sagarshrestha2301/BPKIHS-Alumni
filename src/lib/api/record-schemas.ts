/**
 * Schemas for stored records (what the API returns), as opposed to ./schemas.ts which
 * validates what forms submit. Used to check seed data now and, later, backend responses.
 */
import { z } from 'zod';

import {
  ALUMNI_SOURCES,
  APPROVAL_STATUSES,
  EVENT_MODES,
  EVENT_STATUSES,
  POST_TYPES,
  PROGRAMMES,
  VISIBILITIES,
} from '@/lib/constants/domain';

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Not a date');
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case words joined by hyphens');

export const alumnusSchema = z.strictObject({
  id: z.string().min(1),
  fullName: z.string().trim().min(1).max(100),
  programme: z.enum(PROGRAMMES),
  batchYear: z.number().int().min(1990).max(2100),
  furtherStudies: z.string().min(1).max(150).optional(),
  currentPosition: z.string().min(1).max(120).optional(),
  organisation: z.string().min(1).max(120).optional(),
  city: z.string().min(1).max(80).optional(),
  country: z.string().min(1).max(80),
  note: z.string().min(1).max(500).optional(),
  photoUrl: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  privacy: z.strictObject({
    email: z.enum(VISIBILITIES),
    phone: z.enum(VISIBILITIES),
    profile: z.enum(VISIBILITIES),
  }),
  status: z.enum(APPROVAL_STATUSES),
  source: z.enum(ALUMNI_SOURCES),
  placeholder: z.boolean().optional(),
  createdAt: isoDate,
});

export const donationGoalSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  targetMinor: z.number().int().positive(),
  raisedMinor: z.number().int().min(0),
  currency: z.literal('NPR'),
  deadline: isoDate.optional(),
  imageUrl: z.string().min(1).optional(),
  placeholder: z.boolean().optional(),
});

export const fundsBreakdownItemSchema = z.strictObject({
  category: z.string().min(1),
  sharePercent: z.number().min(0).max(100),
  amountMinor: z.number().int().min(0),
});

export const boardMemberSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(80),
  term: z.string().min(1).max(40),
  batch: z.string().min(1).max(60).optional(),
  photoUrl: z.string().min(1).optional(),
  bio: z.string().min(1).max(600).optional(),
  visionStatement: z.string().min(1).max(500).optional(),
  isCurrent: z.boolean(),
  placeholder: z.boolean().optional(),
});

export const eventSchema = z.strictObject({
  id: z.string().min(1),
  slug,
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(250),
  description: z.string().min(1).max(2000),
  startsAt: isoDate,
  endsAt: isoDate.optional(),
  venue: z.string().min(1).max(120),
  city: z.string().min(1).max(80),
  mode: z.enum(EVENT_MODES),
  capacity: z.number().int().positive().optional(),
  rsvpCount: z.number().int().min(0),
  imageUrl: z.string().min(1).optional(),
  status: z.enum(EVENT_STATUSES),
  goalId: z.string().min(1).optional(),
  gallery: z
    .array(
      z.strictObject({
        type: z.enum(['photo', 'video']),
        url: z.string().min(1),
        alt: z.string().min(1),
      }),
    )
    .optional(),
  placeholder: z.boolean().optional(),
});

export const feedPostSchema = z.strictObject({
  id: z.string().min(1),
  type: z.enum(POST_TYPES),
  status: z.enum(APPROVAL_STATUSES),
  title: z.string().min(1).max(140),
  excerpt: z.string().min(1).max(300),
  body: z.string().min(1).max(3000),
  author: z.string().min(1).max(100),
  publishedAt: isoDate,
  imageUrl: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)),
  placeholder: z.boolean().optional(),
});

export const faqItemSchema = z.strictObject({
  id: z.string().min(1),
  category: z.string().min(1).max(40),
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(1500),
  placeholder: z.boolean().optional(),
});

export const welcomeMessageSchema = z.strictObject({
  author: z.string().min(1),
  role: z.string().min(1),
  text: z.string().min(1).max(1500),
  videoUrl: z.string().min(1).optional(),
  photoUrl: z.string().min(1).optional(),
  placeholder: z.boolean().optional(),
});
