/**
 * Behaviour every adapter must have. The mock runs it now (see mock/contract.test.ts).
 * A real backend adapter must pass the same suite: that is the proof that swapping
 * adapters needs no component changes.
 */
import { describe, expect, it } from 'vitest';

import type { ApiClient } from './contract';

const caught = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: unknown) =>
      error as { code?: string; status?: number; fieldErrors?: Record<string, string> },
  );

export function runContractSuite(name: string, create: () => ApiClient) {
  describe(`API contract: ${name}`, () => {
    it('offers filter options that match real results', async () => {
      const api = create();
      const options = await api.getAlumniFilterOptions();
      expect(new Set(options.countries).size).toBe(options.countries.length);
      expect(options.batchYears.every((year) => typeof year === 'number')).toBe(true);
      const country = options.countries[0];
      expect(country).toBeDefined();
      if (country) expect((await api.listAlumni({ country })).items.length).toBeGreaterThan(0);
    });

    it('returns paginated lists in the agreed shape', async () => {
      const api = create();
      for (const page of [await api.listAlumni(), await api.listEvents(), await api.listFeed()]) {
        expect(page).toEqual(
          expect.objectContaining({
            items: expect.any(Array),
            total: expect.any(Number),
            page: 1,
            pageSize: expect.any(Number),
          }),
        );
        expect(page.items.length).toBeLessThanOrEqual(page.pageSize);
      }
    });

    it('answers a missing record with not_found (404)', async () => {
      const api = create();
      for (const call of [
        api.getAlumnus('missing'),
        api.getGoal('missing'),
        api.getEvent('missing'),
      ]) {
        expect(await caught(call)).toMatchObject({ code: 'not_found', status: 404 });
      }
    });

    it('rejects invalid input with validation (422) and per-field messages', async () => {
      const api = create();
      const error = await caught(
        api.submitSupportTicket({
          topic: 'general',
          name: '',
          email: 'nope',
          subject: '',
          message: 'x',
        }),
      );
      expect(error).toMatchObject({ code: 'validation', status: 422 });
      expect(Object.keys(error?.fieldErrors ?? {})).toEqual(
        expect.arrayContaining(['name', 'email', 'subject', 'message']),
      );
    });

    it('keeps a new registration out of every public view until approved', async () => {
      const api = create();
      const before = await api.getSiteStats();
      const { id, status } = await api.submitRegistration({
        fullName: 'Contract Tester',
        email: 'contract@example.com',
        programme: 'MBBS',
        batchYear: 2015,
        country: 'Nepal',
        privacy: { email: 'hidden', phone: 'hidden', profile: 'public' },
        consent: true,
      });
      expect(status).toBe('pending');
      expect((await api.listAlumni({ q: 'Contract Tester' })).items).toHaveLength(0);
      expect(await caught(api.getAlumnus(id))).toMatchObject({ code: 'not_found' });
      expect((await api.getSiteStats()).alumniCount).toBe(before.alumniCount);
    });

    it('never returns an email or phone the alumnus chose to hide', async () => {
      const api = create();
      const page = await api.listAlumni({ pageSize: 50 });
      for (const person of page.items) {
        if (person.privacy.email === 'hidden') expect('email' in person, person.id).toBe(false);
        if (person.privacy.phone === 'hidden') expect('phone' in person, person.id).toBe(false);
        expect(person.status).toBe('approved');
        expect(person.privacy.profile).not.toBe('hidden');
      }
    });

    it('keeps member posts pending and off the feed', async () => {
      const api = create();
      const { id, status } = await api.submitPost({
        type: 'story',
        title: 'A contract test story',
        body: 'This post must wait for moderation before anyone sees it.',
        authorName: 'Contract Tester',
        authorEmail: 'contract@example.com',
      });
      expect(status).toBe('pending');
      const feed = await api.listFeed({ pageSize: 50 });
      expect(feed.items.some((post) => post.id === id)).toBe(false);
      expect(feed.items.every((post) => post.status === 'approved')).toBe(true);
    });

    it('only credits money when a payment succeeds', async () => {
      const api = create();
      const before = (await api.getSiteStats()).raisedMinor;
      const result = await api.createDonation({
        amountMinor: 250_000,
        currency: 'NPR',
        method: 'khalti',
        anonymous: true,
      });
      const after = (await api.getSiteStats()).raisedMinor;
      expect(after).toBe(result.status === 'succeeded' ? before + 250_000 : before);
    });

    it('signs up, signs in, and refuses an unknown or duplicate email', async () => {
      const api = create();
      const session = await api.signup({ fullName: 'Contract Donor', email: 'donor@example.com' });
      expect((await api.login({ email: 'donor@example.com' })).userId).toBe(session.userId);
      expect(await caught(api.login({ email: 'ghost@example.com' }))).toMatchObject({
        code: 'unauthorized',
        status: 401,
      });
      expect(
        await caught(api.signup({ fullName: 'Again', email: 'donor@example.com' })),
      ).toMatchObject({
        code: 'validation',
      });
    });

    it('does not reveal whether an address is subscribed to the newsletter', async () => {
      const api = create();
      await expect(
        api.updateNewsletterPrefs({ email: 'unknown@example.com', optIn: false }),
      ).resolves.toEqual({ ok: true });
    });
  });
}
