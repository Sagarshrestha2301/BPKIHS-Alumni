import type { Metadata } from 'next';

import { EmptyState } from '@/components/shared/empty-state';
import { adminPostsPage } from '@/content/admin';
import { AdminPageHeader } from '@/features/admin/page-header';
import { PostActions } from '@/features/admin/post-actions';
import { StaffPostEditor } from '@/features/admin/staff-post-editor';
import { formatDate } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { listPendingPosts, listPublishedPostsForAdmin } from '@/server/services/community';

export const metadata: Metadata = { title: adminPostsPage.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

export default async function AdminPostsPage() {
  await requireAdminPage();

  const [posts, published] = await Promise.all([listPendingPosts(), listPublishedPostsForAdmin()]);

  return (
    <div className="space-y-9">
      <AdminPageHeader title={adminPostsPage.title} description={adminPostsPage.description} />

      <section aria-labelledby="post-queue-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="post-queue-heading"
            className="font-heading text-primary-900 text-xl font-semibold"
          >
            {adminPostsPage.queueTitle}
          </h2>
          <p className="text-sm text-neutral-600">{adminPostsPage.queueCount(posts.length)}</p>
        </div>

        {posts.length === 0 ? (
          <EmptyState className="mt-4" title={adminPostsPage.empty} />
        ) : (
          <ul className="mt-4 space-y-4">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-neutral-300 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs tracking-wide text-neutral-600 uppercase">{post.type}</p>
                    <h3 className="font-heading text-primary-900 mt-1 text-xl font-semibold">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {post.author}
                      {post.authorEmail ? ` · ${post.authorEmail}` : ''} ·{' '}
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <PostActions id={post.id} />
                </div>
                <p className="mt-3 text-sm text-neutral-600">{post.excerpt}</p>
                <details className="mt-2">
                  <summary className="text-primary-700 cursor-pointer text-sm underline underline-offset-4">
                    {adminPostsPage.readMore}
                  </summary>
                  <p className="mt-2 text-sm whitespace-pre-line text-neutral-600">{post.body}</p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="border-t border-neutral-300 pt-8">
        <StaffPostEditor posts={published} />
      </div>
    </div>
  );
}
