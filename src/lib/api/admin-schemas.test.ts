import { describe, expect, it } from 'vitest';

import {
  adminBoardInputSchema,
  adminEventInputSchema,
  adminFaqInputSchema,
  adminFundInputSchema,
  adminGoalInputSchema,
  adminPostInputSchema,
  adminWelcomeInputSchema,
  alumniImportRequestSchema,
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

describe('adminFundInputSchema', () => {
  it('accepts a whole share between 1 and 100', () => {
    expect(
      adminFundInputSchema.safeParse({
        category: 'Scholarships',
        sharePercent: 40,
        sortOrder: 0,
      }).success,
    ).toBe(true);
  });

  it('rejects a share of zero or above 100', () => {
    expect(
      adminFundInputSchema.safeParse({ category: 'A', sharePercent: 0, sortOrder: 0 }).success,
    ).toBe(false);
    expect(
      adminFundInputSchema.safeParse({ category: 'A', sharePercent: 101, sortOrder: 0 }).success,
    ).toBe(false);
  });

  it('rejects a fractional share', () => {
    expect(
      adminFundInputSchema.safeParse({
        category: 'A',
        sharePercent: 12.5,
        sortOrder: 0,
      }).success,
    ).toBe(false);
  });
});

describe('adminPostInputSchema', () => {
  it('accepts a staff announcement with a secure image', () => {
    expect(
      adminPostInputSchema.safeParse({
        type: 'announcement',
        title: 'Annual general meeting',
        body: 'The annual general meeting will be held in Dharan this December.',
        author: 'BPKIHS Alumni Association',
        imageUrl: '/images/auditorium.jpg',
      }).success,
    ).toBe(true);
  });

  it('rejects a member-only type and an insecure image', () => {
    expect(
      adminPostInputSchema.safeParse({
        type: 'in_memoriam',
        title: 'Not a staff type',
        body: 'A long enough body for the staff editor.',
        author: 'BPKIHS Alumni Association',
      }).success,
    ).toBe(true);
    expect(
      adminPostInputSchema.safeParse({
        type: 'news',
        title: 'Staff news',
        body: 'A long enough body for the staff editor.',
        author: 'BPKIHS Alumni Association',
        imageUrl: 'http://evil.example/a.jpg',
      }).success,
    ).toBe(false);
  });
});

describe('adminWelcomeInputSchema', () => {
  it('accepts a complete welcome message with an https video', () => {
    expect(
      adminWelcomeInputSchema.safeParse({
        author: 'Dr Rukmini Basnyat',
        role: 'President, BPKIHS Alumni Association',
        text: 'Welcome to the alumni network. Whatever took you away from Dharan, you are still part of this community.',
        videoUrl: 'https://www.youtube.com/watch?v=abc',
      }).success,
    ).toBe(true);
  });

  it('rejects an empty message', () => {
    expect(
      adminWelcomeInputSchema.safeParse({
        author: 'Dr Rukmini Basnyat',
        role: 'President',
        text: 'Too short',
      }).success,
    ).toBe(false);
  });
});

describe('alumniImportRequestSchema', () => {
  const base = {
    csv: 'Name,Email\nAsha,asha@example.com\n',
    mapping: {
      fullName: 0,
      email: 1,
      programme: null,
      batchYear: null,
      country: null,
      phone: null,
      city: null,
      currentPosition: null,
      organisation: null,
      furtherStudies: null,
      note: null,
    },
    dryRun: true,
  };

  it('holds imported rows unless publication is chosen explicitly', () => {
    expect(alumniImportRequestSchema.parse(base).publish).toBe(false);
    expect(alumniImportRequestSchema.parse({ ...base, publish: true }).publish).toBe(true);
  });
});
