import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Flower2,
  type LucideIcon,
  Megaphone,
  Newspaper,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { communityPage } from '@/content/community';
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

/** Only drawn on the photo-led home cards, where a post without a photo needs a panel. */
const POST_TYPE_ICONS: Record<PostType, LucideIcon> = {
  news: Newspaper,
  story: BookOpen,
  notice: Bell,
  achievement: Award,
  event: CalendarDays,
  announcement: Megaphone,
  in_memoriam: Flower2,
};

/**
 * A feed post teaser linking to its own page. Shared by /community and the home page.
 *
 * `withImage` is opt-in because the home page leads with a photo when the author supplied one,
 * while the listing stays a compact text index. `unoptimized` matches the post page: the URL is
 * author-supplied and can point at any host, so the image optimizer's allowlist does not apply.
 */
export function PostCard({
  post,
  action,
  withImage = false,
}: {
  post: FeedPost;
  action?: ReactNode;
  withImage?: boolean;
}) {
  const href = `/community/${encodeURIComponent(post.id)}`;
  const image = withImage ? post.imageUrl : undefined;
  const TypeIcon = POST_TYPE_ICONS[post.type];

  return (
    <Card id={post.id} className="h-full">
      {image ? (
        <Image
          src={image}
          alt=""
          width={1200}
          height={675}
          unoptimized
          className="aspect-video h-auto w-full object-cover"
        />
      ) : withImage ? (
        // A post without a photo keeps the same media height, so a mixed row still lines up.
        <div
          data-slot="post-media"
          aria-hidden="true"
          className="bg-primary-100 text-primary-700/45 -mt-(--card-spacing) flex aspect-video items-center justify-center rounded-t-xl"
        >
          <TypeIcon className="size-9" strokeWidth={1.5} />
        </div>
      ) : null}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{POST_TYPE_LABELS[post.type]}</Badge>
          <time dateTime={post.publishedAt} className="text-sm text-neutral-600">
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h3 className="font-heading text-primary-900 mt-2 text-xl leading-snug font-semibold">
          <Link href={href} className="hover:underline">
            {post.title}
          </Link>
        </h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-4 text-base text-neutral-600">{post.excerpt}</p>
        <Link
          href={href}
          className="text-primary-700 mt-3 inline-flex min-h-6 items-center self-start text-sm font-medium underline underline-offset-4"
        >
          {communityPage.readMore}
        </Link>
        <p className="mt-auto pt-4 text-sm font-medium text-neutral-900">{post.author}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
