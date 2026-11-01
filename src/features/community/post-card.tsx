import {
  ArrowRight,
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
    /* 'group' drives the photo zoom and the arrow nudge; lift comes from card-lift. */
    <Card
      id={post.id}
      className="group card-lift hover:border-primary-700/40 h-full border-neutral-300/80 shadow-xs transition-all duration-180"
    >
      {image ? (
        // The wrapper clips the zoomed photo to the card's top corners with subtle vignette.
        <div className="relative overflow-hidden rounded-t-xl bg-neutral-900">
          <Image
            src={image}
            alt=""
            width={1200}
            height={675}
            unoptimized
            className="aspect-video h-auto w-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent"
          />
        </div>
      ) : withImage ? (
        // A post without a photo keeps the same media height, so a mixed row still lines up.
        <div
          data-slot="post-media"
          aria-hidden="true"
          className="bg-primary-100/70 text-primary-700/60 group-hover:bg-primary-100 -mt-(--card-spacing) flex aspect-video items-center justify-center rounded-t-xl transition-colors duration-180"
        >
          <TypeIcon
            className="size-10 transition-transform duration-200 group-hover:scale-105"
            strokeWidth={1.5}
          />
        </div>
      ) : null}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {POST_TYPE_LABELS[post.type]}
          </Badge>
          <time dateTime={post.publishedAt} className="text-xs font-medium text-neutral-600">
            {formatDate(post.publishedAt)}
          </time>
        </div>
        <h3 className="font-heading text-primary-900 mt-2 text-xl leading-snug font-semibold tracking-tight">
          <Link href={href} className="hover:underline">
            {post.title}
          </Link>
        </h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-4 text-base leading-relaxed text-neutral-600">{post.excerpt}</p>
        <Link
          href={href}
          className="group/link text-primary-700 hover:text-primary-900 mt-3 inline-flex min-h-6 items-center self-start text-sm font-semibold underline underline-offset-4"
        >
          {communityPage.readMore}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-180 motion-safe:group-hover/link:translate-x-1"
          />
        </Link>
        <p className="mt-auto pt-4 text-sm font-medium text-neutral-900">{post.author}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
