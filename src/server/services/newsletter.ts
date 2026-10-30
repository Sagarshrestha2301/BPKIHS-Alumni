import { and, count, desc, eq, ilike, inArray, sql } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import type { AdminSubscriber, NewsletterCampaign } from '@/lib/api/admin';
import type { NewsletterCampaignInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import type { NewsletterInterest } from '@/lib/api/types';

import { config } from '../config';
import { db } from '../db/client';
import {
  donationGoals,
  events,
  feedPosts,
  newsletterCampaigns,
  newsletterSubscribers,
} from '../db/schema';
import { sendEmail, sendEmailBatch } from '../email';
import { appUrl } from '../http/app-url';
import { unsubscribeUrl } from '../newsletter-links';
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
    status?: 'subscribed' | 'unsubscribed' | 'pending';
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

export interface DigestResult {
  subject: string;
  body: string;
  recipients: number;
  sent: number;
  failed: number;
  skipped: boolean;
  campaignId?: string;
}

/**
 * Builds and sends the monthly digest. The cron script calls this; an operator can run the
 * same command by hand. A campaign with this month's subject that already sent is skipped,
 * so a repeated cron run cannot mail everyone twice. `dryRun` composes the message and
 * counts recipients without writing or sending anything.
 */
export async function sendMonthlyDigest(options: { dryRun?: boolean } = {}): Promise<DigestResult> {
  const now = new Date();
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: config.timeZone,
  }).format(now);
  const subject = `BPKIHS alumni digest: ${month}`;

  const [existing] = await db
    .select({ id: newsletterCampaigns.id })
    .from(newsletterCampaigns)
    .where(
      and(
        eq(newsletterCampaigns.subject, subject),
        inArray(newsletterCampaigns.status, ['sending', 'sent']),
      ),
    )
    .limit(1);

  const base = appUrl();
  const [posts, upcoming, goals] = await Promise.all([
    db
      .select({
        id: feedPosts.id,
        title: feedPosts.title,
        excerpt: feedPosts.excerpt,
      })
      .from(feedPosts)
      .where(
        and(
          eq(feedPosts.status, 'approved'),
          inArray(feedPosts.type, ['news', 'story', 'achievement', 'event', 'announcement']),
        ),
      )
      .orderBy(desc(feedPosts.publishedAt))
      .limit(3),
    db
      .select({
        slug: events.slug,
        title: events.title,
        startsAt: events.startsAt,
        venue: events.venue,
        city: events.city,
      })
      .from(events)
      .where(and(eq(events.status, 'upcoming'), sql`${events.startsAt} >= now()`))
      .orderBy(events.startsAt)
      .limit(3),
    db
      .select({
        id: donationGoals.id,
        title: donationGoals.title,
        raisedMinor: donationGoals.raisedMinor,
        targetMinor: donationGoals.targetMinor,
      })
      .from(donationGoals)
      .where(eq(donationGoals.active, true))
      .orderBy(donationGoals.sortOrder)
      .limit(3),
  ]);

  const digest = emailCopy.monthlyDigest({
    month,
    posts: posts.map((post) => ({
      title: post.title,
      excerpt: post.excerpt,
      url: `${base}/community/${post.id}`,
    })),
    events: upcoming.map((event) => ({
      title: event.title,
      when: new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: config.timeZone,
      }).format(event.startsAt),
      venue: `${event.venue}, ${event.city}`,
      url: `${base}/events/${event.slug}`,
    })),
    goals: goals.map((goal) => ({
      title: goal.title,
      progress: `${Math.round((Number(goal.raisedMinor) / Number(goal.targetMinor)) * 100)}% of the target raised`,
      url: `${base}/donate`,
    })),
    siteUrl: base,
    preferencesUrl: `${base}/community/newsletter`,
    unsubscribeUrl: `${base}/community/newsletter`,
  });

  const recipients = await db
    .select({ email: newsletterSubscribers.email, token: newsletterSubscribers.token })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'subscribed'))
    .limit(config.newsletter.maxRecipients + 1);

  if (existing) {
    return {
      subject: digest.subject,
      body: digest.text,
      recipients: recipients.length,
      sent: 0,
      failed: 0,
      skipped: true,
      campaignId: existing.id,
    };
  }

  if (options.dryRun) {
    return {
      subject: digest.subject,
      body: digest.text,
      recipients: Math.min(recipients.length, config.newsletter.maxRecipients),
      sent: 0,
      failed: 0,
      skipped: false,
    };
  }

  if (recipients.length === 0) {
    throw new ApiError('conflict', 'There are no subscribed addresses to send to.');
  }
  if (recipients.length > config.newsletter.maxRecipients) {
    throw new ApiError(
      'conflict',
      `More than ${config.newsletter.maxRecipients} subscribers. Raise NEWSLETTER_MAX_RECIPIENTS or send the digest in parts.`,
    );
  }

  const campaignId = crypto.randomUUID();
  await db.insert(newsletterCampaigns).values({
    id: campaignId,
    subject,
    body: digest.text,
    status: 'sending',
    recipientCount: recipients.length,
  });

  let sent = 0;
  let failed = 0;
  for (let start = 0; start < recipients.length; start += config.newsletter.batchSize) {
    const batch = recipients.slice(start, start + config.newsletter.batchSize);
    try {
      await sendEmailBatch(
        batch.map((recipient) => ({
          to: recipient.email,
          ...emailCopy.monthlyDigest({
            month,
            posts: posts.map((post) => ({
              title: post.title,
              excerpt: post.excerpt,
              url: `${base}/community/${post.id}`,
            })),
            events: upcoming.map((event) => ({
              title: event.title,
              when: new Intl.DateTimeFormat('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: config.timeZone,
              }).format(event.startsAt),
              venue: `${event.venue}, ${event.city}`,
              url: `${base}/events/${event.slug}`,
            })),
            goals: goals.map((goal) => ({
              title: goal.title,
              progress: `${Math.round((Number(goal.raisedMinor) / Number(goal.targetMinor)) * 100)}% of the target raised`,
              url: `${base}/donate`,
            })),
            siteUrl: base,
            preferencesUrl: `${base}/community/newsletter`,
            unsubscribeUrl: unsubscribeUrl(recipient.token),
          }),
        })),
      );
      sent += batch.length;
    } catch (error) {
      failed += batch.length;
      console.error('[newsletter] digest batch failed', campaignId, error);
    }
  }

  await db
    .update(newsletterCampaigns)
    .set({
      status: sent > 0 ? 'sent' : 'failed',
      sentCount: sent,
      failedCount: failed,
      sentAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId));

  return {
    subject,
    body: digest.text,
    recipients: recipients.length,
    sent,
    failed,
    skipped: false,
    campaignId,
  };
}

export interface SubscriberTotals {
  total: number;
  subscribed: number;
  /** Signed up but has not clicked the confirmation link yet. */
  pending: number;
  unsubscribed: number;
}

/** One row of counts per state, used by the admin overview and the subscriber filters. */
export async function subscriberTotals(): Promise<SubscriberTotals> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      subscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'subscribed')::int`,
      pending: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'pending')::int`,
      unsubscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'unsubscribed')::int`,
    })
    .from(newsletterSubscribers);
  return {
    total: Number(row?.total ?? 0),
    subscribed: Number(row?.subscribed ?? 0),
    pending: Number(row?.pending ?? 0),
    unsubscribed: Number(row?.unsubscribed ?? 0),
  };
}
