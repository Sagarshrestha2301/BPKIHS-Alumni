import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import type { AdminSubscriber, NewsletterCampaign } from '@/lib/api/admin';
import type { NewsletterCampaignInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import type { NewsletterInterest } from '@/lib/api/types';

import { config } from '../config';
import { db } from '../db/client';
import { newsletterCampaigns, newsletterSubscribers } from '../db/schema';
import { sendEmail, sendEmailBatch } from '../email';
import { appUrl } from '../http/app-url';
import { writeAudit } from './audit';

type SubscriberRow = typeof newsletterSubscribers.$inferSelect;

function toSubscriber(row: SubscriberRow): AdminSubscriber {
  return {
    id: row.id,
    email: row.email,
    interests: row.interests as NewsletterInterest[],
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCampaign(row: typeof newsletterCampaigns.$inferSelect): NewsletterCampaign {
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    recipientCount: row.recipientCount,
    sentCount: row.sentCount,
    failedCount: row.failedCount,
    createdAt: row.createdAt.toISOString(),
    ...(row.sentAt ? { sentAt: row.sentAt.toISOString() } : {}),
  };
}

export async function countSubscribers(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'subscribed'));
  return Number(row?.value ?? 0);
}

export async function listSubscribersForAdmin(
  params: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: 'subscribed' | 'unsubscribed';
  } = {},
) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, params.pageSize ?? config.pagination.adminPageSize),
  );
  const term = params.q?.trim();

  const filters = [
    params.status ? eq(newsletterSubscribers.status, params.status) : undefined,
    term ? ilike(newsletterSubscribers.email, `%${term}%`) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;

  const [rows, totals, subscribed] = await Promise.all([
    db
      .select()
      .from(newsletterSubscribers)
      .where(where)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(newsletterSubscribers).where(where),
    db
      .select({ value: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'subscribed')),
  ]);

  return {
    items: rows.map(toSubscriber),
    total: Number(totals[0]?.value ?? 0),
    subscribed: Number(subscribed[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export async function listCampaigns(limit = 20): Promise<NewsletterCampaign[]> {
  const rows = await db
    .select()
    .from(newsletterCampaigns)
    .orderBy(desc(newsletterCampaigns.createdAt))
    .limit(limit);
  return rows.map(toCampaign);
}

function unsubscribeUrl(token: string): string {
  return `${appUrl()}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * Sends one campaign to every subscribed address, in batches, and records the result.
 *
 * The recipient list is capped by `NEWSLETTER_MAX_RECIPIENTS` so a single request cannot
 * run forever. A failed batch is counted and the remaining batches still get a chance; the
 * campaign row shows exactly how many messages left the server.
 */
export async function sendCampaign(
  input: NewsletterCampaignInput,
  adminId: string,
): Promise<{ campaign: NewsletterCampaign; test: boolean }> {
  if (input.testEmail) {
    await sendEmail({
      to: input.testEmail,
      ...emailCopy.campaign({
        subject: input.subject,
        body: input.body,
        unsubscribeUrl: `${appUrl()}/community/newsletter`,
      }),
    });
    return {
      test: true,
      campaign: {
        id: 'test',
        subject: input.subject,
        status: 'sent',
        recipientCount: 1,
        sentCount: 1,
        failedCount: 0,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      },
    };
  }

  const recipients = await db
    .select({
      email: newsletterSubscribers.email,
      token: newsletterSubscribers.token,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'subscribed'))
    .limit(config.newsletter.maxRecipients + 1);

  if (recipients.length === 0) {
    throw new ApiError('conflict', 'There are no subscribed addresses to send to.');
  }
  if (recipients.length > config.newsletter.maxRecipients) {
    throw new ApiError(
      'conflict',
      `More than ${config.newsletter.maxRecipients} subscribers. Raise NEWSLETTER_MAX_RECIPIENTS or split the campaign.`,
    );
  }

  const campaignId = crypto.randomUUID();
  await db.insert(newsletterCampaigns).values({
    id: campaignId,
    subject: input.subject,
    body: input.body,
    status: 'sending',
    recipientCount: recipients.length,
    createdBy: adminId,
  });

  let sent = 0;
  let failed = 0;

  for (let start = 0; start < recipients.length; start += config.newsletter.batchSize) {
    const batch = recipients.slice(start, start + config.newsletter.batchSize);
    try {
      await sendEmailBatch(
        batch.map((recipient) => ({
          to: recipient.email,
          ...emailCopy.campaign({
            subject: input.subject,
            body: input.body,
            unsubscribeUrl: unsubscribeUrl(recipient.token),
          }),
        })),
      );
      sent += batch.length;
    } catch (error) {
      failed += batch.length;
      console.error('[newsletter] batch failed', campaignId, error);
    }
  }

  const status = sent > 0 ? 'sent' : 'failed';
  const now = new Date();
  await db
    .update(newsletterCampaigns)
    .set({
      status,
      sentCount: sent,
      failedCount: failed,
      sentAt: now,
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  await writeAudit({
    actorId: adminId,
    action: 'send',
    entity: 'newsletter_campaign',
    entityId: campaignId,
    detail: { recipients: recipients.length, sent, failed },
  });

  const [row] = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId));

  return {
    test: false,
    campaign: row
      ? toCampaign(row)
      : {
          id: campaignId,
          subject: input.subject,
          status,
          recipientCount: recipients.length,
          sentCount: sent,
          failedCount: failed,
          createdAt: now.toISOString(),
          sentAt: now.toISOString(),
        },
  };
}

/** Total rows, used by the admin overview. */
export async function subscriberTotals(): Promise<{ total: number; subscribed: number }> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      subscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'subscribed')::int`,
    })
    .from(newsletterSubscribers);
  return { total: Number(row?.total ?? 0), subscribed: Number(row?.subscribed ?? 0) };
}
