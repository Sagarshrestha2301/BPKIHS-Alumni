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
export function PostCard({ post }: { post: FeedPost }) {
  return (
    <Card className="h-full">
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
        <p className="line-clamp-4 text-base text-neutral-600">{post.excerpt}</p>
        <p className="mt-auto pt-4 text-sm font-medium text-neutral-900">{post.author}</p>
      </CardContent>
    </Card>
  );
}
