'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { communityPage } from '@/content/community';
import { useSession } from '@/features/auth/session-provider';
import { PostCard } from '@/features/community/post-card';
import { ReportPost } from '@/features/community/report-post';
import type { ApiClient } from '@/lib/api/client';
import type { FeedPost } from '@/lib/api/types';
import type { PostType } from '@/lib/constants/domain';
import { FEED_PAGE_SIZE } from '@/lib/constants/pagination';
import { cn } from '@/lib/utils';

const PAGE_SIZE = FEED_PAGE_SIZE;

export function CommunityFeed({ posts, client }: { posts: FeedPost[]; client?: ApiClient }) {
  const copy = communityPage;
  const { status } = useSession();
  const [filter, setFilter] = useState<PostType | ''>('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = filter ? posts.filter((post) => post.type === filter) : posts;
  const shown = filtered.slice(0, visible);

  return (
    <div>
      <div role="group" aria-label={copy.filtersLabel} className="flex flex-wrap gap-2">
        {copy.filters.map((item) => {
          const active = filter === item.value;
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(item.value as PostType | '');
                setVisible(PAGE_SIZE);
              }}
              className={cn(
                'btn-press min-h-10 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold shadow-xs transition-all duration-180',
                active
                  ? 'border-primary-900 bg-primary-900 ring-primary-900/15 text-white shadow-sm ring-2'
                  : 'hover:border-primary-700/60 hover:bg-primary-100/50 border-neutral-300 bg-white text-neutral-700',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-neutral-300/80 bg-neutral-100/60 p-8 text-center text-neutral-600 shadow-xs">
          <p className="font-heading text-primary-900 text-lg font-semibold">{copy.empty}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {shown.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              // Reporting is a members-only action; the API enforces it either way.
              action={
                status === 'signed_in' ? <ReportPost postId={post.id} client={client} /> : null
              }
            />
          ))}
        </div>
      )}

      {filtered.length > visible ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="h-11 px-5 text-base"
          >
            {copy.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
