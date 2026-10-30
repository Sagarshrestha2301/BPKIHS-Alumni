import { and, desc, eq, inArray, ne } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
import type { AdminPost } from '@/lib/api/admin';
import type { AdminPostInput } from '@/lib/api/admin-schemas';
import { ApiError } from '@/lib/api/errors';
import { queryFeed } from '@/lib/api/queries';
import type {
  MemberPostInput,
  NewsletterPrefsInput,
  NewsletterSubscribeInput,
  PostReportInput,
} from '@/lib/api/schemas';
import type {
  FeedListParams,
  FeedPost,
  NewsletterSubscribeResult,
  OkResult,
  Paginated,
  PostSubmissionResult,
  PostType,
} from '@/lib/api/types';

import { config } from '../config';
import { db } from '../db/client';
import { feedPosts, newsletterSubscribers, postReports } from '../db/schema';
import { sendEmailSafely } from '../email';
import { confirmUrl, unsubscribeUrl } from '../newsletter-links';

const POST_TAG: Record<PostType, string> = {
  news: 'News',
  story: 'Stories',
  notice: 'Notice',
  achievement: 'Achievement',
  event: 'Events',
  announcement: 'Announcement',
  in_memoriam: 'In Memoriam',
};

function excerptFrom(body: string): string {
  return body.length > 160 ? `${body.slice(0, 157).trimEnd()}…` : body.trim();
}

function toPost(row: typeof feedPosts.$inferSelect): FeedPost {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    author: row.author,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    tags: row.tags,
    placeholder: row.placeholder,
  };
}

export async function listFeed(params: FeedListParams = {}): Promise<Paginated<FeedPost>> {
  const rows = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.status, 'approved'))
    .orderBy(desc(feedPosts.publishedAt));
  return queryFeed(rows.map(toPost), params);
}

/** One approved post. Pending and rejected submissions are never readable from here. */
export async function getPost(id: string): Promise<FeedPost> {
  const [row] = await db
    .select()
    .from(feedPosts)
    .where(and(eq(feedPosts.id, id), eq(feedPosts.status, 'approved')));
  if (!row) throw new ApiError('not_found', 'That post was not found.');
  return toPost(row);
}

export async function submitPost(input: MemberPostInput): Promise<PostSubmissionResult> {
  const id = `post-${crypto.randomUUID()}`;

  await db.insert(feedPosts).values({
    id,
    type: input.type,
    status: 'pending',
    title: input.title,
    excerpt: excerptFrom(input.body),
    body: input.body,
    author: input.authorName,
    authorEmail: input.authorEmail,
    tags: [POST_TAG[input.type]],
    imageUrl: input.imageUrl || null,
    publishedAt: null,
  });

  return { id, status: 'pending' };
}

export async function reportPost(postId: string, input: PostReportInput): Promise<OkResult> {
  const [post] = await db
    .select({ id: feedPosts.id })
    .from(feedPosts)
    .where(eq(feedPosts.id, postId));
  if (!post) throw new ApiError('not_found', 'That post was not found.');

  await db.insert(postReports).values({
    id: crypto.randomUUID(),
    postId,
    reason: input.reason,
    details: input.details ?? null,
  });
  return { ok: true };
}

/**
 * A pending address may ask again after this long, so a lost confirmation email can be
 * re-requested without letting anyone use the public form to flood an inbox.
 */
const CONFIRMATION_RESEND_MS = 15 * 60 * 1000;

/**
 * Double opt-in: the address is held as `pending` and only joins the list when it opens the
 * link sent to it. That link is what proves the person asking controls the inbox, so a
 * stranger cannot add someone who never asked.
 *
 * The result never says whether an address is already on the list; the send form is public and
 * must not become an oracle. `confirmationEmailSent` is about the send attempt only.
 */
export async function subscribeNewsletter(
  input: NewsletterSubscribeInput,
): Promise<NewsletterSubscribeResult> {
  const email = input.email.toLowerCase();
  const now = new Date();

  const [existing] = await db
    .select({
      status: newsletterSubscribers.status,
      confirmationSentAt: newsletterSubscribers.confirmationSentAt,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email));

  // Already confirmed: keep the interests current and send nothing. A public form must not
  // become a way to mail an inbox on demand. Nothing failed, so the answer reports success.
  if (existing?.status === 'subscribed') {
    await db
      .update(newsletterSubscribers)
      .set({ interests: input.interests, updatedAt: now })
      .where(eq(newsletterSubscribers.email, email));
    return { ok: true, confirmationEmailSent: true };
  }

  // A failed send leaves `confirmationSentAt` null, so a retry goes out immediately instead of
  // waiting out the window for an email that never arrived.
  const resendDue =
    existing?.status !== 'pending' ||
    !existing.confirmationSentAt ||
    now.getTime() - existing.confirmationSentAt.getTime() >= CONFIRMATION_RESEND_MS;

  // The stored token is reused, so a link already sitting in an inbox keeps working. `setWhere`
  // leaves a confirmed row alone when a concurrent request got there first; that conflict
  // returns no row and the caller is answered the same way.
  const [row] = await db
    .insert(newsletterSubscribers)
    .values({
      id: crypto.randomUUID(),
      email,
      interests: input.interests,
      status: 'pending',
      token: crypto.randomUUID(),
    })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { interests: input.interests, status: 'pending', updatedAt: now },
      setWhere: ne(newsletterSubscribers.status, 'subscribed'),
    })
    .returning({ token: newsletterSubscribers.token });

  // No row means a concurrent request confirmed the address first; a fresh confirmation email
  // is already in flight in the other case.
  if (!row || !resendDue) return { ok: true, confirmationEmailSent: true };

  const sent = await sendEmailSafely({
    to: email,
    ...emailCopy.newsletterConfirm({ url: confirmUrl(row.token) }),
  });
  if (!sent) return { ok: true, confirmationEmailSent: false };

  await db
    .update(newsletterSubscribers)
    .set({ confirmationSentAt: now })
    .where(eq(newsletterSubscribers.email, email));

  return { ok: true, confirmationEmailSent: true };
}

/**
 * Confirms a pending subscription through the token from its own email.
 *
 * Only `pending` rows are promoted, so a link that arrives after an unsubscribe cannot put
 * the address back on the list. A token that is already confirmed still answers `true`, so a
 * second click or a retried request is not shown as an error.
 */
export async function confirmNewsletterSubscription(token: string): Promise<boolean> {
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'subscribed', updatedAt: new Date() })
    .where(
      and(
        eq(newsletterSubscribers.token, token),
        inArray(newsletterSubscribers.status, ['pending', 'subscribed']),
      ),
    )
    .returning({ email: newsletterSubscribers.email });
  return Boolean(row);
}

/**
 * Changes a subscription only when the caller presents the token from that subscriber's own
 * email. An email address is public knowledge, so it can never be enough on its own: without
 * this, anyone could unsubscribe a member (or subscribe a stranger who never asked).
 *
 * The answer is always `{ ok: true }`, whether or not the address is on the list, so the
 * endpoint cannot be used to discover who is subscribed.
 */
export async function updateNewsletterPrefs(input: NewsletterPrefsInput): Promise<OkResult> {
  const email = input.email.toLowerCase();

  if (input.token) {
    const [subscriber] = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(
        and(eq(newsletterSubscribers.token, input.token), eq(newsletterSubscribers.email, email)),
      );

    if (subscriber) {
      await db
        .update(newsletterSubscribers)
        .set({
          status: input.optIn ? 'subscribed' : 'unsubscribed',
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscribers.id, subscriber.id));
    }
    return { ok: true };
  }

  // Opting in needs the subscribe form, which records interests and sends the welcome
  // message. This endpoint exists to stop the digest, so an untokened opt-in is refused.
  if (input.optIn) {
    throw new ApiError('validation', 'Use the subscribe form to join the newsletter.');
  }

  // No token: never change the record. If the address is subscribed, mail it the one-click
  // link and answer exactly the same way as for an unknown address.
  const [subscribed] = await db
    .select({ token: newsletterSubscribers.token })
    .from(newsletterSubscribers)
    .where(
      and(eq(newsletterSubscribers.email, email), eq(newsletterSubscribers.status, 'subscribed')),
    );

  if (subscribed) {
    await sendEmailSafely({
      to: email,
      ...emailCopy.newsletterUnsubscribeConfirmation({ url: unsubscribeUrl(subscribed.token) }),
    });
  }
  return { ok: true };
}

/**
 * One-click unsubscribe from a link in a newsletter email. Returns false for an unknown or
 * already-rotated token; the caller answers the same way either way.
 */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed', updatedAt: new Date() })
    .where(eq(newsletterSubscribers.token, token))
    .returning({ id: newsletterSubscribers.id });
  return Boolean(row);
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

function toAdminPost(row: typeof feedPosts.$inferSelect): AdminPost {
  return {
    ...toPost(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Published posts an administrator can edit: staff news, notices and announcements. */
export async function listPublishedPostsForAdmin(): Promise<AdminPost[]> {
  const rows = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.status, 'approved'))
    .orderBy(desc(feedPosts.publishedAt));
  return rows.map(toAdminPost);
}

/** A post written by the office is approved on save: no second person is needed. */
export async function createStaffPost(input: AdminPostInput, adminId: string): Promise<AdminPost> {
  const now = new Date();
  const [row] = await db
    .insert(feedPosts)
    .values({
      id: `post-${crypto.randomUUID()}`,
      type: input.type,
      status: 'approved',
      title: input.title,
      excerpt: excerptFrom(input.body),
      body: input.body,
      author: input.author,
      authorEmail: null,
      tags: [POST_TAG[input.type]],
      imageUrl: input.imageUrl || null,
      publishedAt: now,
      reviewedBy: adminId,
      reviewedAt: now,
    })
    .returning();
  if (!row) throw new ApiError('server', 'The post could not be saved.');
  return toAdminPost(row);
}

export async function updateStaffPost(
  id: string,
  input: AdminPostInput,
  adminId: string,
): Promise<AdminPost> {
  const [row] = await db
    .update(feedPosts)
    .set({
      type: input.type,
      title: input.title,
      excerpt: excerptFrom(input.body),
      body: input.body,
      author: input.author,
      tags: [POST_TAG[input.type]],
      imageUrl: input.imageUrl || null,
      reviewedBy: adminId,
      updatedAt: new Date(),
    })
    .where(and(eq(feedPosts.id, id), eq(feedPosts.status, 'approved')))
    .returning();
  if (!row) throw new ApiError('not_found', 'That published post was not found.');
  return toAdminPost(row);
}

export async function deleteStaffPost(id: string): Promise<{ ok: true }> {
  const [row] = await db
    .delete(feedPosts)
    .where(eq(feedPosts.id, id))
    .returning({ id: feedPosts.id });
  if (!row) throw new ApiError('not_found', 'That post was not found.');
  return { ok: true };
}

export async function listPendingPosts(limit: number = config.pagination.maxPageSize) {
  const rows = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.status, 'pending'))
    .orderBy(desc(feedPosts.createdAt))
    .limit(Math.max(1, Math.min(limit, config.pagination.maxPageSize)));
  return rows.map((row) => ({
    ...toPost(row),
    authorEmail: row.authorEmail,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listOpenReports(limit: number = config.pagination.maxPageSize) {
  const rows = await db
    .select({
      id: postReports.id,
      postId: postReports.postId,
      reason: postReports.reason,
      details: postReports.details,
      createdAt: postReports.createdAt,
      postTitle: feedPosts.title,
    })
    .from(postReports)
    .innerJoin(feedPosts, eq(feedPosts.id, postReports.postId))
    .where(eq(postReports.status, 'open'))
    .orderBy(desc(postReports.createdAt))
    .limit(Math.max(1, Math.min(limit, config.pagination.maxPageSize)));

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function moderatePost(
  postId: string,
  action: 'approve' | 'reject',
  adminId: string,
  reason?: string,
) {
  const now = new Date();
  const [row] = await db
    .update(feedPosts)
    .set({
      status: action === 'approve' ? 'approved' : 'rejected',
      publishedAt: action === 'approve' ? now : null,
      reviewedBy: adminId,
      reviewedAt: now,
      rejectionReason: action === 'reject' ? (reason ?? null) : null,
      updatedAt: now,
    })
    .where(and(eq(feedPosts.id, postId), eq(feedPosts.status, 'pending')))
    .returning({ id: feedPosts.id });

  if (!row) throw new ApiError('not_found', 'That pending post was not found.');
  return { ok: true as const };
}

export async function resolveReport(
  reportId: string,
  action: 'reviewed' | 'dismissed',
  adminId: string,
) {
  const [row] = await db
    .update(postReports)
    .set({ status: action, reviewedBy: adminId, reviewedAt: new Date() })
    .where(and(eq(postReports.id, reportId), eq(postReports.status, 'open')))
    .returning({ id: postReports.id });
  if (!row) throw new ApiError('not_found', 'That open report was not found.');
  return { ok: true as const };
}
