import { describe, expect, it } from 'vitest';

import {
  adminBoardInputSchema,
  adminEventInputSchema,
  adminFaqInputSchema,
  adminGoalInputSchema,
  adminWelcomeInputSchema,
  newsletterCampaignInputSchema,
} from './admin-schemas';

const event = {
  slug: 'annual-general-meeting-2026',
  title: 'Annual general meeting',
  summary: 'Alumni return to Dharan for the annual meeting.',
  description: 'Join fellow alumni for the annual general meeting and dinner.',
  startsAt: '2026-12-12T17:45:00.000Z',
  venue: 'BPKIHS Auditorium',
  city: 'Dharan',
  mode: 'in_person',
  status: 'upcoming',
};

describe('adminEventInputSchema', () => {
  it('accepts a complete event', () => {
    expect(adminEventInputSchema.safeParse(event).success).toBe(true);
  });

  it('rejects a slug with capitals or spaces', () => {
    expect(adminEventInputSchema.safeParse({ ...event, slug: 'Annual Meeting' }).success).toBe(
      false,
    );
  });

  it('rejects an end before the start', () => {
    expect(
      adminEventInputSchema.safeParse({ ...event, endsAt: '2026-12-11T10:00:00.000Z' }).success,
    ).toBe(false);
  });

  it('rejects an insecure gallery URL', () => {
    expect(
      adminEventInputSchema.safeParse({
        ...event,
        gallery: [{ type: 'photo', url: 'http://example.org/a.jpg', alt: 'Photo' }],
      }).success,
    ).toBe(false);
  });

  it('accepts a relative image path but not a protocol-relative one', () => {
    expect(adminEventInputSchema.safeParse({ ...event, imageUrl: '/images/a.jpg' }).success).toBe(
      true,
    );
    expect(
      adminEventInputSchema.safeParse({ ...event, imageUrl: '//evil.example/a.jpg' }).success,
    ).toBe(false);
  });
});

describe('adminGoalInputSchema', () => {
  it('requires a positive target', () => {
    expect(
      adminGoalInputSchema.safeParse({
        title: 'Library fund',
        description: 'Restock the library.',
        targetMinor: 0,
        active: true,
        sortOrder: 0,
      }).success,
    ).toBe(false);
  });

  it('accepts a valid goal', () => {
    expect(
      adminGoalInputSchema.safeParse({
        title: 'Library fund',
        description: 'Restock the library.',
        targetMinor: 500_000,
        active: true,
        sortOrder: 0,
      }).success,
    ).toBe(true);
  });
});

describe('other content schemas', () => {
  it('requires a board term and role', () => {
    expect(
      adminBoardInputSchema.safeParse({
        name: 'Dr Sita Rai',
        role: 'President',
        term: '2024–2026',
        isCurrent: true,
        sortOrder: 0,
      }).success,
    ).toBe(true);
  });

  it('accepts a FAQ entry', () => {
    expect(
      adminFaqInputSchema.safeParse({
        category: 'Account',
        question: 'How do I register?',
        answer: 'Use the registration form on this site.',
        sortOrder: 0,
      }).success,
    ).toBe(true);
  });

  it('validates the welcome message', () => {
    expect(
      adminWelcomeInputSchema.safeParse({
        author: 'Dr Sita Rai',
        role: 'President',
        text: 'Welcome to the alumni community of BPKIHS.',
      }).success,
    ).toBe(true);
  });
});

describe('newsletterCampaignInputSchema', () => {
  it('requires a subject and body', () => {
    expect(newsletterCampaignInputSchema.safeParse({ subject: 'Hi', body: 'short' }).success).toBe(
      false,
    );
  });

  it('accepts a test recipient', () => {
    expect(
      newsletterCampaignInputSchema.safeParse({
        subject: 'Alumni news',
        body: 'The annual meeting is on 12 December. We hope to see you there.',
        testEmail: 'office@example.org',
      }).success,
    ).toBe(true);
  });
});
