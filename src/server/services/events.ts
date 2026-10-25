import { and, asc, eq, or, sql } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import type { AdminEvent } from '@/lib/api/admin';
import type { AdminEventInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import { queryEvents } from '@/lib/api/queries';
import type { RsvpInput } from '@/lib/api/schemas';
import type { AlumniEvent, EventListParams, OkResult, Paginated } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format/dates';

import { db } from '../db/client';
import { eventRsvps, events } from '../db/schema';
import { sendEmailSafely } from '../email';

function toEvent(row: typeof events.$inferSelect, rsvpCount: number): AlumniEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    startsAt: row.startsAt.toISOString(),
    ...(row.endsAt ? { endsAt: row.endsAt.toISOString() } : {}),
    venue: row.venue,
    city: row.city,
    mode: row.mode,
    ...(row.capacity !== null ? { capacity: row.capacity } : {}),
    rsvpCount,
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    status: row.status,
    ...(row.goalId ? { goalId: row.goalId } : {}),
    ...(row.gallery ? { gallery: row.gallery } : {}),
    placeholder: row.placeholder,
  };
}

async function confirmedGuests(eventId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int` })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, 'confirmed')));
  return Number(row?.value ?? 0);
}

export async function listEvents(params: EventListParams = {}): Promise<Paginated<AlumniEvent>> {
  const [rows, totals] = await Promise.all([
    db.select().from(events).orderBy(asc(events.startsAt)),
    db
      .select({
        eventId: eventRsvps.eventId,
        guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int`,
      })
      .from(eventRsvps)
      .where(eq(eventRsvps.status, 'confirmed'))
      .groupBy(eventRsvps.eventId),
  ]);

  const counts = new Map(totals.map((row) => [row.eventId, Number(row.guests)]));
  const mapped = rows.map((row) => toEvent(row, row.baseRsvpCount + (counts.get(row.id) ?? 0)));
  return queryEvents(mapped, params);
}

function toAdminEvent(row: typeof events.$inferSelect, rsvpCount: number): AdminEvent {
  return {
    ...toEvent(row, rsvpCount),
    ...(row.endsAt ? { endsAt: row.endsAt.toISOString() } : {}),
    ...(row.gallery ? { gallery: row.gallery } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getEvent(slug: string): Promise<AlumniEvent> {
  const [row] = await db.select().from(events).where(eq(events.slug, slug));
  if (!row) throw new ApiError('not_found', 'That event was not found.');
  return toEvent(row, row.baseRsvpCount + (await confirmedGuests(row.id)));
}

export async function submitRsvp(eventIdOrSlug: string, input: RsvpInput): Promise<OkResult> {
  const result = await db.transaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(events)
      .where(or(eq(events.id, eventIdOrSlug), eq(events.slug, eventIdOrSlug)))
      .for('update');
    if (!event) throw new ApiError('not_found', 'That event was not found.');
    const eventId = event.id;

    const [countRow] = await tx
      .select({ value: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int` })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, 'confirmed')));

    const taken = event.baseRsvpCount + Number(countRow?.value ?? 0);
    const full = event.capacity !== null && taken + input.partySize > event.capacity;
    const status = full ? 'waitlist' : 'confirmed';

    await tx
      .insert(eventRsvps)
      .values({
        id: crypto.randomUUID(),
        eventId,
        name: input.name,
        email: input.email,
        guests: input.partySize,
        status,
      })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.email],
        set: { name: input.name, guests: input.partySize, status },
      });

    return { event, status };
  });

  const details = {
    name: input.name,
    eventTitle: result.event.title,
    when: formatDateTime(result.event.startsAt.toISOString()),
    venue: result.event.venue,
    city: result.event.city,
  };
  const message =
    result.status === 'confirmed'
      ? emailCopy.rsvpConfirmed({ ...details, partySize: input.partySize })
      : emailCopy.rsvpWaitlisted(details);

  await sendEmailSafely({ to: input.email, ...message });

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

export async function listEventsForAdmin(): Promise<AdminEvent[]> {
  const [rows, totals] = await Promise.all([
    db.select().from(events).orderBy(asc(events.startsAt)),
    db
      .select({
        eventId: eventRsvps.eventId,
        guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int`,
      })
      .from(eventRsvps)
      .where(eq(eventRsvps.status, 'confirmed'))
      .groupBy(eventRsvps.eventId),
  ]);
  const counts = new Map(totals.map((row) => [row.eventId, Number(row.guests)]));
  return rows.map((row) => toAdminEvent(row, row.baseRsvpCount + (counts.get(row.id) ?? 0)));
}

function valuesFromInput(input: AdminEventInput) {
  return {
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    description: input.description,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    venue: input.venue,
    city: input.city,
    mode: input.mode,
    capacity: input.capacity ?? null,
    imageUrl: input.imageUrl || null,
    status: input.status,
    goalId: input.goalId ?? null,
    gallery: input.gallery ?? null,
    updatedAt: new Date(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function createEvent(input: AdminEventInput): Promise<AdminEvent> {
  const id = `event-${crypto.randomUUID()}`;
  try {
    const [row] = await db
      .insert(events)
      .values({ id, ...valuesFromInput(input) })
      .returning();
    if (!row) throw new ApiError('server', 'The event could not be saved.');
    return toAdminEvent(row, row.baseRsvpCount);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError('conflict', 'That slug is already used by another event.');
    }
    throw error;
  }
}

export async function updateEvent(id: string, input: AdminEventInput): Promise<AdminEvent> {
  try {
    const [row] = await db
      .update(events)
      .set(valuesFromInput(input))
      .where(eq(events.id, id))
      .returning();
    if (!row) throw new ApiError('not_found', 'That event was not found.');
    return toAdminEvent(row, row.baseRsvpCount + (await confirmedGuests(row.id)));
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError('conflict', 'That slug is already used by another event.');
    }
    throw error;
  }
}

export async function deleteEvent(id: string): Promise<{ ok: true }> {
  const [row] = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
  if (!row) throw new ApiError('not_found', 'That event was not found.');
  return { ok: true };
}
