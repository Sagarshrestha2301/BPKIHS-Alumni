import { describe, expect, it } from 'vitest';

import { isApiError } from '../errors';
import { alumniSeed } from './data/alumni';
import { postsSeed } from './data/posts';
import { createMockAdapter } from './index';

const api = createMockAdapter();
const everyone = { pageSize: 50 };

describe('mock adapter: site', () => {
  it('computes stats from the data', async () => {
    const stats = await api.getSiteStats();
    const approved = alumniSeed.filter((person) => person.status === 'approved');
    expect(stats.alumniCount).toBe(approved.length);
    expect(stats.raisedMinor).toBeGreaterThan(0);
    expect(stats.activeProgrammes).toBe(new Set(approved.map((p) => p.programme)).size);
    expect(stats.eventsHeld).toBe(6);
  });

  it('returns the welcome message', async () => {
    const message = await api.getWelcomeMessage();
    expect(message.author).toBeTruthy();
  });
});

describe('mock adapter: alumni privacy', () => {
  it('lists only approved people with visible profiles', async () => {
    const all = await api.listAlumni({ ...everyone, page: 1 });
    const second = await api.listAlumni({ ...everyone, page: 2 });
    const listed = [...all.items, ...second.items];
    const hiddenIds = alumniSeed
      .filter((p) => p.status !== 'approved' || p.privacy.profile === 'hidden')
      .map((p) => p.id);
    expect(hiddenIds.length).toBeGreaterThan(0);
    for (const id of hiddenIds)
      expect(
        listed.some((p) => p.id === id),
        id,
      ).toBe(false);
    expect(all.total).toBe(
      alumniSeed.filter((p) => p.status === 'approved' && p.privacy.profile !== 'hidden').length,
    );
  });

  it('never returns an email or phone whose visibility is hidden', async () => {
    const result = await api.listAlumni(everyone);
    for (const person of result.items) {
      const source = alumniSeed.find((candidate) => candidate.id === person.id);
      if (!source) throw new Error('unknown id ' + person.id);
      if (source.privacy.phone === 'hidden') expect('phone' in person, person.id).toBe(false);
      if (source.privacy.email === 'hidden') expect('email' in person, person.id).toBe(false);
    }
  });

  it('shows an alumni_only email to the default viewer, but not to an outsider', async () => {
    const target = alumniSeed.find(
      (p) =>
        p.status === 'approved' &&
        p.privacy.profile === 'public' &&
        p.privacy.email === 'alumni_only',
    );
    if (!target) throw new Error('seed has no alumni_only email');
    expect((await api.getAlumnus(target.id)).email).toBe(target.email);
    const outsiderApi = createMockAdapter({ viewer: { isAlumnus: false } });
    expect('email' in (await outsiderApi.getAlumnus(target.id))).toBe(false);
  });

  it('treats hidden and pending profiles exactly like missing ones', async () => {
    const hidden = alumniSeed.find(
      (p) => p.privacy.profile === 'hidden' && p.status === 'approved',
    );
    const pending = alumniSeed.find((p) => p.status === 'pending');
    if (!hidden || !pending) throw new Error('seed lacks hidden or pending record');
    for (const id of [hidden.id, pending.id, 'does-not-exist']) {
      const error = await api.getAlumnus(id).catch((caught: unknown) => caught);
      expect(isApiError(error), id).toBe(true);
      expect(error).toMatchObject({ code: 'not_found', status: 404 });
    }
  });

  it('searches and filters within the visible set', async () => {
    const bmit = await api.listAlumni({ ...everyone, programme: 'BMIT' });
    expect(bmit.items.length).toBeGreaterThan(0);
    expect(bmit.items.every((p) => p.programme === 'BMIT')).toBe(true);
    const search = await api.listAlumni({ q: 'cardiologist' });
    expect(search.items.every((p) => /cardiolog/i.test(JSON.stringify(p)))).toBe(true);
  });

  it('paginates at 12 by default', async () => {
    const page = await api.listAlumni();
    expect(page.pageSize).toBe(12);
    expect(page.items).toHaveLength(12);
  });

  it('returns copies, so changing a result cannot change the store', async () => {
    const first = await api.listAlumni();
    const original = first.items[0]?.fullName;
    if (first.items[0]) first.items[0].fullName = 'Tampered';
    const again = await api.listAlumni();
    expect(again.items[0]?.fullName).toBe(original);
  });
});

describe('mock adapter: giving and governance', () => {
  it('lists goals with the general fund first, and finds one by id', async () => {
    const goals = await api.listGoals();
    expect(goals[0]?.id).toBe('general-fund');
    expect((await api.getGoal('goal-library')).title).toMatch(/library/i);
    await expect(api.getGoal('nope')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('returns a funds breakdown that adds up to the total raised', async () => {
    const [breakdown, stats] = await Promise.all([api.getFundsBreakdown(), api.getSiteStats()]);
    expect(breakdown.reduce((sum, item) => sum + item.amountMinor, 0)).toBe(stats.raisedMinor);
  });

  it('splits the board into current and previous', async () => {
    const current = await api.listBoard({ current: true });
    const previous = await api.listBoard({ current: false });
    expect(current.length).toBeGreaterThan(0);
    expect(current.every((member) => member.isCurrent)).toBe(true);
    expect(previous.every((member) => !member.isCurrent)).toBe(true);
  });
});

describe('mock adapter: events', () => {
  it('filters by status with sensible default order', async () => {
    const upcoming = await api.listEvents({ status: 'upcoming' });
    expect(upcoming.total).toBe(6);
    const starts = upcoming.items.map((event) => Date.parse(event.startsAt));
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect((await api.listEvents({ status: 'past' })).total).toBe(6);
  });

  it('finds an event by slug, including its gallery and linked goal', async () => {
    expect((await api.getEvent('annual-alumni-reunion-2026')).goalId).toBe('goal-scholarship');
    expect(
      (await api.getEvent('health-informatics-workshop-bmit')).gallery?.length,
    ).toBeGreaterThan(0);
    await expect(api.getEvent('nope')).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('mock adapter: feed moderation', () => {
  it('shows approved posts only, newest first', async () => {
    const feed = await api.listFeed({ pageSize: 50 });
    expect(feed.total).toBe(12);
    const hidden = postsSeed.filter((post) => post.status !== 'approved').map((post) => post.id);
    for (const id of hidden)
      expect(
        feed.items.some((post) => post.id === id),
        id,
      ).toBe(false);
    const dates = feed.items.map((post) => Date.parse(post.publishedAt));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it('filters by type, including In Memoriam', async () => {
    const memoriam = await api.listFeed({ type: 'in_memoriam' });
    expect(memoriam.items.length).toBeGreaterThan(0);
    expect(memoriam.items.every((post) => post.type === 'in_memoriam')).toBe(true);
  });

  it('returns the FAQ', async () => {
    expect(await api.listFaq()).toHaveLength(10);
  });
});
