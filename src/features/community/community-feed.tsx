'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { communityPage } from '@/content/community';
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
                'min-h-10 rounded-full border px-4 text-sm font-medium',
                active
                  ? 'border-primary-700 bg-primary-700 text-white'
                  : 'hover:bg-primary-100 border-neutral-500 text-neutral-900',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-neutral-100 p-8 text-center text-neutral-600">
          {copy.empty}
        </p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {shown.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              expandable
              readMoreLabel={copy.readMore}
              action={<ReportPost postId={post.id} client={client} />}
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
