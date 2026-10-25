import { desc, eq } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import { ApiError } from '@/lib/api/errors';
import type { HelpdeskInput } from '@/lib/api/schemas';
import type { TicketResult } from '@/lib/api/types';

import { config } from '../config';
import { db } from '../db/client';
import { supportTickets } from '../db/schema';
import { sendEmailSafely } from '../email';

export type TicketStatus = 'open' | 'in_progress' | 'closed';

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

export async function listTicketsForAdmin(status?: TicketStatus) {
  const rows = await db
    .select()
    .from(supportTickets)
    .where(status ? eq(supportTickets.status, status) : undefined)
    .orderBy(desc(supportTickets.createdAt));

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
