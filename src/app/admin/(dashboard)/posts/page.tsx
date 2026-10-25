import type { Metadata } from 'next';

import { EmptyState } from '@/components/shared/empty-state';
import { adminPostsPage } from '@/content/admin';
import { PostActions } from '@/features/admin/post-actions';
import { formatDate } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { listPendingPosts } from '@/server/services/community';

export const metadata: Metadata = { title: adminPostsPage.title };

export default async function AdminPostsPage() {
  await requireAdminPage();

  const posts = await listPendingPosts();

  return (
    <div>
      <h1 className="font-heading text-primary-900 text-3xl font-semibold">
        {adminPostsPage.title}
      </h1>
      <p className="mt-2 text-neutral-600">{adminPostsPage.description}</p>

      {posts.length === 0 ? (
        <EmptyState className="mt-6" title={adminPostsPage.empty} />
      ) : (
        <ul className="mt-6 space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="rounded-xl border border-neutral-300 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs tracking-wide text-neutral-600 uppercase">{post.type}</p>
                  <h2 className="font-heading text-primary-900 mt-1 text-xl font-semibold">
                    {post.title}
                  </h2>
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
    </div>
  );
}
