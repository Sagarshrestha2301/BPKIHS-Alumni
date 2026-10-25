import { and, desc, eq } from 'drizzle-orm';

import { emailCopy } from '@/content/email';
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
  MemberPostType,
  OkResult,
  Paginated,
  PostSubmissionResult,
} from '@/lib/api/types';

import { db } from '../db/client';
import { feedPosts, newsletterSubscribers, postReports } from '../db/schema';
import { sendEmailSafely } from '../email';

const POST_TAG: Record<MemberPostType, string> = {
  story: 'Stories',
  achievement: 'Achievement',
  notice: 'Notice',
  in_memoriam: 'In Memoriam',
};

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

export async function submitPost(input: MemberPostInput): Promise<PostSubmissionResult> {
  const id = `post-${crypto.randomUUID()}`;
  const excerpt =
    input.body.length > 160 ? `${input.body.slice(0, 157).trimEnd()}…` : input.body.trim();

  await db.insert(feedPosts).values({
    id,
    type: input.type,
    status: 'pending',
    title: input.title,
    excerpt,
    body: input.body,
    author: input.authorName,
    authorEmail: input.authorEmail,
    tags: [POST_TAG[input.type]],
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

export async function subscribeNewsletter(input: NewsletterSubscribeInput): Promise<OkResult> {
  const email = input.email.toLowerCase();
  const token = crypto.randomUUID();

  await db
    .insert(newsletterSubscribers)
    .values({
      id: crypto.randomUUID(),
      email,
      interests: input.interests,
      status: 'subscribed',
      token,
    })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: { interests: input.interests, status: 'subscribed', updatedAt: new Date() },
    });

  await sendEmailSafely({ to: email, ...emailCopy.newsletterWelcome });

  return { ok: true };
}

export async function updateNewsletterPrefs(input: NewsletterPrefsInput): Promise<OkResult> {
  const email = input.email.toLowerCase();
  await db
    .insert(newsletterSubscribers)
    .values({
      id: crypto.randomUUID(),
      email,
      interests: [],
      status: input.optIn ? 'subscribed' : 'unsubscribed',
      token: crypto.randomUUID(),
    })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      set: {
        status: input.optIn ? 'subscribed' : 'unsubscribed',
        updatedAt: new Date(),
      },
    });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

export async function listPendingPosts() {
  const rows = await db
    .select()
    .from(feedPosts)
    .where(eq(feedPosts.status, 'pending'))
    .orderBy(desc(feedPosts.createdAt));
  return rows.map((row) => ({
    ...toPost(row),
    authorEmail: row.authorEmail,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listOpenReports() {
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
    .orderBy(desc(postReports.createdAt));

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
