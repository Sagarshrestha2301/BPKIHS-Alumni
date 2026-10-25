import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { communityPosts } from '@/content/home';
import { PostCard } from '@/features/community/post-card';
import type { FeedPost } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** Hides itself when there are no posts to show. */
export function CommunityPostsView({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) return null;

  return (
    <Section tone="muted" aria-label={communityPosts.title}>
      <SectionHeading
        eyebrow={communityPosts.eyebrow}
        title={communityPosts.title}
        description={communityPosts.description}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="mt-8">
        <Link
          href={communityPosts.allHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
        >
          {communityPosts.allLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
