import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { FeedPost } from '@/lib/api/types';
import type { PostType } from '@/lib/constants/domain';
import { formatDate } from '@/lib/format/dates';

export const POST_TYPE_LABELS: Record<PostType, string> = {
  news: 'News',
  story: 'Story',
  notice: 'Notice',
  achievement: 'Achievement',
  event: 'Event',
  announcement: 'Announcement',
  in_memoriam: 'In memoriam',
};

/** A feed post teaser. Reused on /community in Phase 7. */
export function PostCard({
  post,
  expandable = false,
  readMoreLabel = 'Read more',
  action,
}: {
  post: FeedPost;
  expandable?: boolean;
  readMoreLabel?: string;
  action?: ReactNode;
}) {
  return (
    <Card id={post.id} className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{POST_TYPE_LABELS[post.type]}</Badge>
          <time dateTime={post.publishedAt} className="text-sm text-neutral-600">
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h3 className="font-heading text-primary-900 mt-2 text-xl leading-snug font-semibold">
          {post.title}
        </h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p
          className={
            expandable ? 'text-base text-neutral-600' : 'line-clamp-4 text-base text-neutral-600'
          }
        >
          {post.excerpt}
        </p>
        {expandable && post.body !== post.excerpt ? (
          <details className="mt-3 text-sm">
            <summary className="text-primary-700 cursor-pointer font-medium">
              {readMoreLabel}
            </summary>
            <p className="mt-2 whitespace-pre-line text-neutral-600">{post.body}</p>
          </details>
        ) : null}
        <p className="mt-auto pt-4 text-sm font-medium text-neutral-900">{post.author}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
