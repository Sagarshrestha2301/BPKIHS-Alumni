import { desc, eq, sql } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import { ApiError } from '@/lib/api/errors';
import type { HelpdeskInput } from '@/lib/api/schemas';
import type { TicketResult } from '@/lib/api/types';

import { config } from '../config';
import { db } from '../db/client';
import { supportTickets } from '../db/schema';
import { sendEmailSafely } from '../email';

export type TicketStatus = 'open' | 'in_progress' | 'closed';

export interface TicketCounts {
  all: number;
  open: number;
  in_progress: number;
  closed: number;
}

/** How many tickets sit in each state, for the filter chips. */
export async function getTicketCounts(): Promise<TicketCounts> {
  const rows = await db
    .select({ status: supportTickets.status, value: sql<number>`count(*)::int` })
    .from(supportTickets)
    .groupBy(supportTickets.status);

  const counts: TicketCounts = { all: 0, open: 0, in_progress: 0, closed: 0 };
  for (const row of rows) {
    const value = Number(row.value);
    counts[row.status] = value;
    counts.all += value;
  }
  return counts;
}

function reference(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `${config.support.referencePrefix}-${year}-${suffix}`;
}

export async function submitSupportTicket(input: HelpdeskInput): Promise<TicketResult> {
  const ticketId = crypto.randomUUID();
  const ref = reference();

  await db.insert(supportTickets).values({
    id: ticketId,
    reference: ref,
    name: input.name,
    email: input.email,
    topic: input.topic,
    subject: input.subject,
    message: input.message,
  });

  await sendEmailSafely({
    to: input.email,
    ...emailCopy.supportReceived({
      name: input.name,
      subject: input.subject,
      reference: ref,
      message: input.message,
      replyWindowDays: config.support.replyWindowDays,
    }),
  });

  return { ticketId };
}

export async function listTicketsForAdmin(status?: TicketStatus, limit?: number) {
  const query = db
    .select()
    .from(supportTickets)
    .where(status ? eq(supportTickets.status, status) : undefined)
    .orderBy(desc(supportTickets.createdAt));
  const rows =
    limit === undefined
      ? await query
      : await query.limit(Math.max(1, Math.min(limit, config.pagination.maxPageSize)));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function setTicketStatus(ticketId: string, status: TicketStatus) {
  const [row] = await db
    .update(supportTickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId))
    .returning({ id: supportTickets.id });
  if (!row) throw new ApiError('not_found', 'That ticket was not found.');
  return { ok: true as const };
}
