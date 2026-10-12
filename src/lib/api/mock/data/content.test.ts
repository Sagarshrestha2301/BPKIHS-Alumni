import { describe, expect, it } from 'vitest';

import { POST_TYPES } from '@/lib/constants/domain';

import {
  boardMemberSchema,
  donationGoalSchema,
  eventSchema,
  faqItemSchema,
  feedPostSchema,
  fundsBreakdownItemSchema,
  welcomeMessageSchema,
} from '../../record-schemas';
import { boardSeed } from './board';
import { eventsSeed } from './events';
import { faqSeed } from './faq';
import { fundsBreakdownSeed, goalsSeed } from './goals';
import { postsSeed } from './posts';
import { welcomeSeed } from './welcome';

/** Seed dates are fixed around this day, so these tests do not depend on the real clock. */
const REFERENCE = Date.parse('2026-10-12T00:00:00Z');

function expectAllValid<T extends { id?: string }>(
  items: readonly T[],
  schema: { safeParse: (value: unknown) => { success: boolean } },
) {
  for (const item of items) {
    expect(schema.safeParse(item).success, String(item.id)).toBe(true);
  }
}

const unique = (values: readonly string[]) => new Set(values).size === values.length;

describe('goals seed', () => {
  it('passes the schema and flags placeholders', () => {
    expectAllValid(goalsSeed, donationGoalSchema);
    expect(goalsSeed.every((goal) => goal.placeholder === true)).toBe(true);
  });

  it('has the general fund first, then 4 to 5 named goals', () => {
    expect(goalsSeed[0]?.id).toBe('general-fund');
    expect(goalsSeed.length - 1).toBeGreaterThanOrEqual(4);
    expect(goalsSeed.length - 1).toBeLessThanOrEqual(5);
    expect(unique(goalsSeed.map((goal) => goal.id))).toBe(true);
  });

  it('never has more raised than the target, and has one goal almost done', () => {
    for (const goal of goalsSeed)
      expect(goal.raisedMinor, goal.id).toBeLessThanOrEqual(goal.targetMinor);
    expect(goalsSeed.some((goal) => goal.raisedMinor / goal.targetMinor > 0.9)).toBe(true);
  });
});

describe('funds breakdown seed', () => {
  it('passes the schema', () => {
    for (const item of fundsBreakdownSeed) {
      expect(fundsBreakdownItemSchema.safeParse(item).success, item.category).toBe(true);
    }
  });

  it('shares add up to 100 and amounts add up to the total raised', () => {
    const shares = fundsBreakdownSeed.reduce((sum, item) => sum + item.sharePercent, 0);
    const amounts = fundsBreakdownSeed.reduce((sum, item) => sum + item.amountMinor, 0);
    const raised = goalsSeed.reduce((sum, goal) => sum + goal.raisedMinor, 0);
    expect(shares).toBe(100);
    expect(amounts).toBe(raised);
  });
});

describe('board seed', () => {
  it('passes the schema and flags placeholders', () => {
    expectAllValid(boardSeed, boardMemberSchema);
    expect(boardSeed.every((member) => member.placeholder === true)).toBe(true);
  });

  it('has unique ids and names', () => {
    expect(unique(boardSeed.map((member) => member.id))).toBe(true);
    expect(unique(boardSeed.map((member) => member.name))).toBe(true);
  });

  it('has a current board where everyone states a vision', () => {
    const current = boardSeed.filter((member) => member.isCurrent);
    expect(current.length).toBeGreaterThanOrEqual(5);
    expect(new Set(current.map((member) => member.term)).size).toBe(1);
    for (const member of current) expect(member.visionStatement, member.id).toBeTruthy();
  });

  it('has at least two previous boards, grouped by term', () => {
    const previousTerms = new Set(
      boardSeed.filter((member) => !member.isCurrent).map((m) => m.term),
    );
    expect(previousTerms.size).toBeGreaterThanOrEqual(2);
  });
});

describe('events seed', () => {
  const upcoming = eventsSeed.filter((event) => event.status === 'upcoming');
  const past = eventsSeed.filter((event) => event.status === 'past');

  it('passes the schema and flags placeholders', () => {
    expectAllValid(eventsSeed, eventSchema);
    expect(eventsSeed.every((event) => event.placeholder === true)).toBe(true);
  });

  it('has 6 upcoming and 6 past events', () => {
    expect(upcoming).toHaveLength(6);
    expect(past).toHaveLength(6);
  });

  it('puts upcoming events after the reference day and past events before it', () => {
    for (const event of upcoming)
      expect(Date.parse(event.startsAt), event.id).toBeGreaterThan(REFERENCE);
    for (const event of past) expect(Date.parse(event.startsAt), event.id).toBeLessThan(REFERENCE);
  });

  it('ends every event after it starts, and never exceeds capacity', () => {
    for (const event of eventsSeed) {
      if (event.endsAt)
        expect(Date.parse(event.endsAt), event.id).toBeGreaterThan(Date.parse(event.startsAt));
      if (event.capacity) expect(event.rsvpCount, event.id).toBeLessThanOrEqual(event.capacity);
    }
  });

  it('has unique ids and slugs', () => {
    expect(unique(eventsSeed.map((event) => event.id))).toBe(true);
    expect(unique(eventsSeed.map((event) => event.slug))).toBe(true);
  });

  it('has one full upcoming event, for the waitlist wording', () => {
    expect(
      upcoming.some((event) => event.capacity !== undefined && event.rsvpCount >= event.capacity),
    ).toBe(true);
  });

  it('links an event to a goal that exists', () => {
    const linked = eventsSeed.filter((event) => event.goalId);
    expect(linked.length).toBeGreaterThanOrEqual(1);
    const goalIds = new Set(goalsSeed.map((goal) => goal.id));
    for (const event of linked) expect(goalIds.has(event.goalId as string), event.id).toBe(true);
  });

  it('has a gallery on a past event, and on no upcoming event', () => {
    expect(past.some((event) => (event.gallery?.length ?? 0) > 0)).toBe(true);
    expect(upcoming.some((event) => event.gallery)).toBe(false);
  });

  it('mixes in-person, online and hybrid events', () => {
    expect(new Set(eventsSeed.map((event) => event.mode))).toEqual(
      new Set(['in_person', 'online', 'hybrid']),
    );
  });
});

describe('posts seed', () => {
  const approved = postsSeed.filter((post) => post.status === 'approved');

  it('passes the schema and flags placeholders', () => {
    expectAllValid(postsSeed, feedPostSchema);
    expect(postsSeed.every((post) => post.placeholder === true)).toBe(true);
  });

  it('has 12 approved posts plus a pending and a rejected one to be hidden', () => {
    expect(approved).toHaveLength(12);
    expect(postsSeed.some((post) => post.status === 'pending')).toBe(true);
    expect(postsSeed.some((post) => post.status === 'rejected')).toBe(true);
  });

  it('covers every post type among the approved posts, including In Memoriam', () => {
    const types = new Set(approved.map((post) => post.type));
    for (const type of POST_TYPES) expect(types.has(type), type).toBe(true);
  });

  it('has unique ids, dates before the reference day and tags on every post', () => {
    expect(unique(postsSeed.map((post) => post.id))).toBe(true);
    for (const post of postsSeed) {
      expect(Date.parse(post.publishedAt), post.id).toBeLessThan(REFERENCE);
      expect(post.tags.length, post.id).toBeGreaterThan(0);
      expect(post.excerpt.length, post.id).toBeLessThan(post.body.length);
    }
  });
});

describe('faq and welcome seeds', () => {
  it('has 10 valid FAQ items with unique ids and several categories', () => {
    expect(faqSeed).toHaveLength(10);
    expectAllValid(faqSeed, faqItemSchema);
    expect(unique(faqSeed.map((item) => item.id))).toBe(true);
    expect(new Set(faqSeed.map((item) => item.category)).size).toBeGreaterThanOrEqual(4);
  });

  it('has a valid welcome message', () => {
    expect(welcomeMessageSchema.safeParse(welcomeSeed).success).toBe(true);
    expect(welcomeSeed.placeholder).toBe(true);
  });
});
