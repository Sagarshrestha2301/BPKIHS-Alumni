import { count, countDistinct, eq, sql } from 'drizzle-orm';

import type { AdminFaqItem, AdminWelcomeMessage } from '@/lib/api/admin';
import type { AdminFaqInput, AdminWelcomeInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import type { FaqItem, SiteStats, WelcomeMessage } from '@/lib/api/types';

import { db } from '../db/client';
import {
  alumni,
  donations,
  events,
  faqItems,
  feedPosts,
  postReports,
  supportTickets,
  welcomeMessage,
} from '../db/schema';

export async function getSiteStats(): Promise<SiteStats> {
  const [alumniCount, programmeCount, countryCount, pastEvents, raised] = await Promise.all([
    db.select({ value: count() }).from(alumni).where(eq(alumni.status, 'approved')),
    db
      .select({ value: countDistinct(alumni.programme) })
      .from(alumni)
      .where(eq(alumni.status, 'approved')),
    db
      .select({ value: countDistinct(alumni.country) })
      .from(alumni)
      .where(eq(alumni.status, 'approved')),
    db.select({ value: count() }).from(events).where(eq(events.status, 'past')),
    db
      .select({
        value: sql<string>`coalesce(sum(${donations.amountMinor}), 0)::text`,
      })
      .from(donations)
      .where(eq(donations.status, 'succeeded')),
  ]);

  return {
    alumniCount: Number(alumniCount[0]?.value ?? 0),
    activeProgrammes: Number(programmeCount[0]?.value ?? 0),
    countries: Number(countryCount[0]?.value ?? 0),
    eventsHeld: Number(pastEvents[0]?.value ?? 0),
    raisedMinor: Number(raised[0]?.value ?? 0),
  };
}

export async function getWelcomeMessage(): Promise<WelcomeMessage | null> {
  const [row] = await db.select().from(welcomeMessage).where(eq(welcomeMessage.id, 'default'));
  if (!row) return null;
  return {
    author: row.author,
    role: row.role,
    text: row.text,
    ...(row.videoUrl ? { videoUrl: row.videoUrl } : {}),
    ...(row.photoUrl ? { photoUrl: row.photoUrl } : {}),
    placeholder: row.placeholder,
  };
}

export async function listFaq(): Promise<FaqItem[]> {
  const rows = await db.select().from(faqItems).orderBy(faqItems.sortOrder, faqItems.question);
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    placeholder: row.placeholder,
  }));
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

export async function listFaqForAdmin(): Promise<AdminFaqItem[]> {
  const rows = await db.select().from(faqItems).orderBy(faqItems.sortOrder, faqItems.question);
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    placeholder: row.placeholder,
    sortOrder: row.sortOrder,
  }));
}

function faqValues(input: AdminFaqInput) {
  return {
    category: input.category,
    question: input.question,
    answer: input.answer,
    sortOrder: input.sortOrder,
  };
}

export async function createFaq(input: AdminFaqInput): Promise<AdminFaqItem> {
  const [row] = await db
    .insert(faqItems)
    .values({ id: `faq-${crypto.randomUUID()}`, ...faqValues(input) })
    .returning();
  if (!row) throw new ApiError('server', 'The FAQ entry could not be saved.');
  return { ...faqValues(input), id: row.id, placeholder: row.placeholder };
}

export async function updateFaq(id: string, input: AdminFaqInput): Promise<AdminFaqItem> {
  const [row] = await db
    .update(faqItems)
    .set(faqValues(input))
    .where(eq(faqItems.id, id))
    .returning();
  if (!row) throw new ApiError('not_found', 'That FAQ entry was not found.');
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    placeholder: row.placeholder,
    sortOrder: row.sortOrder,
  };
}

export async function deleteFaq(id: string): Promise<{ ok: true }> {
  const [row] = await db.delete(faqItems).where(eq(faqItems.id, id)).returning({ id: faqItems.id });
  if (!row) throw new ApiError('not_found', 'That FAQ entry was not found.');
  return { ok: true };
}

export async function getWelcomeMessageForAdmin(): Promise<AdminWelcomeMessage | null> {
  const [row] = await db.select().from(welcomeMessage).where(eq(welcomeMessage.id, 'default'));
  if (!row) return null;
  return {
    author: row.author,
    role: row.role,
    text: row.text,
    ...(row.videoUrl ? { videoUrl: row.videoUrl } : {}),
    ...(row.photoUrl ? { photoUrl: row.photoUrl } : {}),
    placeholder: row.placeholder,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveWelcomeMessage(input: AdminWelcomeInput): Promise<AdminWelcomeMessage> {
  const values = {
    author: input.author,
    role: input.role,
    text: input.text,
    videoUrl: input.videoUrl || null,
    photoUrl: input.photoUrl || null,
    placeholder: false,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(welcomeMessage)
    .values({ id: 'default', ...values })
    .onConflictDoUpdate({ target: welcomeMessage.id, set: values })
    .returning();
  if (!row) throw new ApiError('server', 'The welcome message could not be saved.');
  return {
    author: row.author,
    role: row.role,
    text: row.text,
    ...(row.videoUrl ? { videoUrl: row.videoUrl } : {}),
    ...(row.photoUrl ? { photoUrl: row.photoUrl } : {}),
    placeholder: row.placeholder,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Used by the admin overview; kept here so every dashboard number has one home. */
export async function getAdminCounts() {
  const [pendingAlumni, pendingPosts, openReports, openTickets] = await Promise.all([
    // Imported register rows are pending review too, so they belong in the queue count even
    // though they carry `placeholder`. Excluding them made the badge disagree with the list.
    db.select({ value: count() }).from(alumni).where(eq(alumni.status, 'pending')),
    db.select({ value: count() }).from(feedPosts).where(eq(feedPosts.status, 'pending')),
    db.select({ value: count() }).from(postReports).where(eq(postReports.status, 'open')),
    db.select({ value: count() }).from(supportTickets).where(eq(supportTickets.status, 'open')),
  ]);

  return {
    pendingAlumni: Number(pendingAlumni[0]?.value ?? 0),
    pendingPosts: Number(pendingPosts[0]?.value ?? 0),
    openReports: Number(openReports[0]?.value ?? 0),
    openTickets: Number(openTickets[0]?.value ?? 0),
  };
}
