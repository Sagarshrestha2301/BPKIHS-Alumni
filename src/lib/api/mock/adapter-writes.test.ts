import { describe, expect, it } from 'vitest';

import { isApiError } from '../errors';
import type {
  DonationInput,
  HelpdeskInput,
  MemberPostInput,
  RegistrationInput,
  RsvpInput,
} from '../schemas';
import { createMockAdapter } from './index';
import { NO_SIMULATION, type SimulationOptions } from './simulate';

const fixedNow = () => new Date('2026-10-12T08:00:00Z');
const fresh = (options: Parameters<typeof createMockAdapter>[0] = {}) =>
  createMockAdapter({ now: fixedNow, ...options });

const caught = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: unknown) => error,
  );

const validRegistration: RegistrationInput = {
  fullName: 'Nima Sherpa',
  email: 'nima@example.com',
  programme: 'BMIT',
  batchYear: 2021,
  country: 'Nepal',
  privacy: { email: 'hidden', phone: 'hidden', profile: 'public' },
  consent: true,
};

const validDonation: DonationInput = {
  amountMinor: 500_000,
  currency: 'NPR',
  method: 'esewa',
  anonymous: false,
};

const validRsvp: RsvpInput = { name: 'Asha Rai', email: 'asha@example.com', partySize: 2 };

const validPost: MemberPostInput = {
  type: 'story',
  title: 'My first year as a resident',
  body: 'A few lines about my first year after graduation, with a lesson or two.',
  authorName: 'Asha Rai',
  authorEmail: 'asha@example.com',
};

const validTicket: HelpdeskInput = {
  topic: 'donation_receipt',
  name: 'Asha Rai',
  email: 'asha@example.com',
  subject: 'Receipt needed',
  message: 'Please resend my donation receipt.',
};

describe('mock adapter: registration', () => {
  it('accepts a registration as pending and keeps it out of every public view', async () => {
    const api = fresh();
    const before = await api.getSiteStats();
    const result = await api.submitRegistration(validRegistration);
    expect(result.status).toBe('pending');
    expect(result.id).toMatch(/^alumnus-new-\d{3}$/);

    const search = await api.listAlumni({ q: 'Nima Sherpa' });
    expect(search.items).toHaveLength(0);
    expect((await api.getSiteStats()).alumniCount).toBe(before.alumniCount);
    await expect(api.getAlumnus(result.id)).rejects.toMatchObject({ code: 'not_found' });
  });

  it('gives each registration its own id', async () => {
    const api = fresh();
    const first = await api.submitRegistration(validRegistration);
    const second = await api.submitRegistration({
      ...validRegistration,
      email: 'other@example.com',
    });
    expect(first.id).not.toBe(second.id);
  });

  it('reports field errors keyed by field', async () => {
    const api = fresh();
    const bad = { ...validRegistration, email: 'nima@', consent: false } as RegistrationInput;
    const error = await caught(api.submitRegistration(bad));
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ code: 'validation', status: 422 });
    const fields = (error as { fieldErrors?: Record<string, string> }).fieldErrors;
    expect(fields?.email).toMatch(/valid email/);
    expect(fields?.consent).toMatch(/agree/);
  });
});

describe('mock adapter: donations', () => {
  it('adds to the general fund by default and keeps the funds breakdown in step', async () => {
    const api = fresh();
    const before = await api.getSiteStats();
    const fundBefore = await api.getGoal('general-fund');

    const result = await api.createDonation(validDonation);
    expect(result.status).toBe('succeeded');
    expect(result.receiptUrl).toContain(result.donationId);

    const fundAfter = await api.getGoal('general-fund');
    expect(fundAfter.raisedMinor).toBe(fundBefore.raisedMinor + 500_000);
    const after = await api.getSiteStats();
    expect(after.raisedMinor).toBe(before.raisedMinor + 500_000);
    const breakdown = await api.getFundsBreakdown();
    expect(breakdown.reduce((sum, item) => sum + item.amountMinor, 0)).toBe(after.raisedMinor);
  });

  it('adds to a chosen goal and accepts a tribute and a linked event', async () => {
    const api = fresh();
    const before = await api.getGoal('goal-scholarship');
    const result = await api.createDonation({
      ...validDonation,
      goalId: 'goal-scholarship',
      eventId: 'event-reunion-2026',
      tribute: { type: 'in_memory', recipientKind: 'mentor', name: 'Dr. Sample Mentor' },
    });
    expect(result.status).toBe('succeeded');
    expect((await api.getGoal('goal-scholarship')).raisedMinor).toBe(before.raisedMinor + 500_000);
  });

  it('gives each donation a unique id', async () => {
    const api = fresh();
    const a = await api.createDonation(validDonation);
    const b = await api.createDonation(validDonation);
    expect(a.donationId).not.toBe(b.donationId);
  });

  it('rejects an unknown goal or event and an amount below the minimum', async () => {
    const api = fresh();
    await expect(api.createDonation({ ...validDonation, goalId: 'nope' })).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(api.createDonation({ ...validDonation, eventId: 'nope' })).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(api.createDonation({ ...validDonation, amountMinor: 100 })).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('does not add money when the payment fails or is pending', async () => {
    for (const outcome of ['failed', 'pending'] as const) {
      const api = fresh({ donationOutcome: outcome });
      const before = (await api.getSiteStats()).raisedMinor;
      const result = await api.createDonation(validDonation);
      expect(result.status).toBe(outcome);
      expect(result.receiptUrl).toBeUndefined();
      expect((await api.getSiteStats()).raisedMinor).toBe(before);
    }
  });
});

describe('mock adapter: RSVP', () => {
  it('adds the party to the count', async () => {
    const api = fresh();
    const before = (await api.getEvent('annual-general-meeting-2027')).rsvpCount;
    await expect(api.submitRsvp('event-agm-2027', validRsvp)).resolves.toEqual({ ok: true });
    expect((await api.getEvent('annual-general-meeting-2027')).rsvpCount).toBe(before + 2);
  });

  it('refuses the same email twice for one event, but allows it for another', async () => {
    const api = fresh();
    await api.submitRsvp('event-agm-2027', validRsvp);
    const error = await caught(
      api.submitRsvp('event-agm-2027', { ...validRsvp, email: 'ASHA@example.com' }),
    );
    expect(error).toMatchObject({ code: 'validation' });
    expect((error as { fieldErrors?: Record<string, string> }).fieldErrors?.email).toBeTruthy();
    await expect(api.submitRsvp('event-sports-day', validRsvp)).resolves.toEqual({ ok: true });
  });

  it('records a full event as a waitlist entry without raising the count', async () => {
    const api = fresh();
    const before = await api.getEvent('rural-health-camp-sunsari');
    expect(before.rsvpCount).toBe(before.capacity);
    await expect(api.submitRsvp('event-camp-sunsari', validRsvp)).resolves.toEqual({ ok: true });
    expect((await api.getEvent('rural-health-camp-sunsari')).rsvpCount).toBe(before.rsvpCount);
  });

  it('rejects past events, unknown events and bad input', async () => {
    const api = fresh();
    await expect(api.submitRsvp('event-blood-drive', validRsvp)).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(api.submitRsvp('nope', validRsvp)).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      api.submitRsvp('event-agm-2027', { ...validRsvp, partySize: 0 }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
  });
});

describe('mock adapter: community', () => {
  it('stores a member post as pending and keeps it out of the feed', async () => {
    const api = fresh();
    const before = (await api.listFeed({ pageSize: 50 })).total;
    const result = await api.submitPost(validPost);
    expect(result.status).toBe('pending');
    expect(result.id).toMatch(/^post-new-\d{3}$/);
    const feed = await api.listFeed({ pageSize: 50 });
    expect(feed.total).toBe(before);
    expect(feed.items.some((post) => post.id === result.id)).toBe(false);
    expect(JSON.stringify(feed)).not.toContain('asha@example.com');
  });

  it('rejects staff-only types and short bodies with field errors', async () => {
    const api = fresh();
    const staffOnly = { ...validPost, type: 'news' } as unknown as MemberPostInput;
    await expect(api.submitPost(staffOnly)).rejects.toMatchObject({ code: 'validation' });
    const error = await caught(api.submitPost({ ...validPost, body: 'Too short' }));
    expect((error as { fieldErrors?: Record<string, string> }).fieldErrors?.body).toBeTruthy();
  });

  it('accepts a report on an approved post only', async () => {
    const api = fresh();
    await expect(api.reportPost('post-annual-update', { reason: 'spam' })).resolves.toEqual({
      ok: true,
    });
    await expect(api.reportPost('nope', { reason: 'spam' })).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(api.reportPost('post-pending-story', { reason: 'spam' })).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('asks for details when the reason is "other"', async () => {
    const api = fresh();
    const error = await caught(api.reportPost('post-annual-update', { reason: 'other' }));
    expect((error as { fieldErrors?: Record<string, string> }).fieldErrors?.details).toBeTruthy();
  });
});

describe('mock adapter: newsletter', () => {
  it('subscribes and updates preferences', async () => {
    const api = fresh();
    await expect(
      api.subscribeNewsletter({
        email: 'Reader@Example.com',
        interests: ['events', 'events', 'giving'],
      }),
    ).resolves.toEqual({ ok: true });
    await expect(
      api.updateNewsletterPrefs({ email: 'reader@example.com', optIn: false }),
    ).resolves.toEqual({
      ok: true,
    });
  });

  it('never reveals whether an unknown address is subscribed', async () => {
    const api = fresh();
    await expect(
      api.updateNewsletterPrefs({ email: 'nobody@example.com', optIn: false }),
    ).resolves.toEqual({
      ok: true,
    });
  });

  it('rejects an invalid email', async () => {
    const api = fresh();
    await expect(api.subscribeNewsletter({ email: 'nope', interests: [] })).rejects.toMatchObject({
      code: 'validation',
    });
  });
});

describe('mock adapter: support', () => {
  it('numbers tickets in order', async () => {
    const api = fresh();
    expect(await api.submitSupportTicket(validTicket)).toEqual({ ticketId: 'TKT-0001' });
    expect(await api.submitSupportTicket(validTicket)).toEqual({ ticketId: 'TKT-0002' });
  });

  it('rejects an unknown topic or a very short message', async () => {
    const api = fresh();
    const badTopic = { ...validTicket, topic: 'billing' } as unknown as HelpdeskInput;
    await expect(api.submitSupportTicket(badTopic)).rejects.toMatchObject({ code: 'validation' });
    await expect(
      api.submitSupportTicket({ ...validTicket, message: 'Help' }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
  });
});

describe('mock adapter: sign in (donation gate)', () => {
  it('signs in the demo account', async () => {
    const api = fresh();
    expect(await api.login({ email: 'demo@example.com' })).toMatchObject({
      userId: 'user-demo',
      email: 'demo@example.com',
    });
  });

  it('refuses an unknown email with unauthorized', async () => {
    const api = fresh();
    const error = await caught(api.login({ email: 'stranger@example.com' }));
    expect(error).toMatchObject({ code: 'unauthorized', status: 401 });
  });

  it('signs up a new account, then signs in with any capitalisation', async () => {
    const api = fresh();
    const session = await api.signup({ fullName: 'New Donor', email: 'New.Donor@Example.com' });
    expect(session.name).toBe('New Donor');
    expect(session.email).toBe('new.donor@example.com');
    expect((await api.login({ email: 'NEW.DONOR@example.com' })).userId).toBe(session.userId);
  });

  it('refuses a duplicate signup with a field error', async () => {
    const api = fresh();
    const error = await caught(api.signup({ fullName: 'Someone', email: 'demo@example.com' }));
    expect(error).toMatchObject({ code: 'validation' });
    expect((error as { fieldErrors?: Record<string, string> }).fieldErrors?.email).toMatch(
      /already exists/,
    );
  });

  it('validates the input', async () => {
    const api = fresh();
    await expect(api.signup({ fullName: '', email: 'x@example.com' })).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(api.login({ email: '' })).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('mock adapter: a failed call changes nothing', () => {
  it('does not save a donation when the simulated call fails', async () => {
    const simulation: SimulationOptions = { ...NO_SIMULATION, errorRate: 1, random: () => 0 };
    const api = fresh({ simulation });

    await expect(api.createDonation(validDonation)).rejects.toMatchObject({ code: 'network' });

    simulation.errorRate = 0;
    const fund = await api.getGoal('general-fund');
    expect(fund.raisedMinor).toBe(865_000 * 100);
  });
});
