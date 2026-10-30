import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { communityPage } from '@/content/community';
import { getPostById } from '@/features/community/get-community-data';
import { POST_TYPE_LABELS } from '@/features/community/post-card';
import { formatDate } from '@/lib/format/dates';
import { cn } from '@/lib/utils';

type PostPageProps = { params: Promise<{ id: string }> };

/**
 * A post exists only under the id in the URL, and a missing or unapproved post must answer
 * 404 rather than a streamed shell. Blocking is the honest shape for that contract.
 */
export const instant = false;

/**
 * A missing post and a post that is still awaiting moderation are the same answer: 404.
 * The API already refuses anything that is not approved.
 */
async function loadPost(id: string) {
  const post = await getPostById(id);
  if (!post) notFound();
  return post;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: communityPage.post.notFoundTitle };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/community/${post.id}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      ...(post.imageUrl ? { images: [{ url: post.imageUrl }] } : {}),
    },
  };
}

export default async function CommunityPostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await loadPost(id);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: communityPage.title, href: '/community' },
          { label: POST_TYPE_LABELS[post.type] },
        ]}
        title={post.title}
        description={post.excerpt}
      />

      <Section>
        <article className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <Badge variant="secondary">{POST_TYPE_LABELS[post.type]}</Badge>
            <span>
              {communityPage.post.byline} {post.author}
            </span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </div>

          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt=""
              width={1200}
              height={675}
              unoptimized
              className="mt-6 h-auto w-full rounded-xl border border-neutral-300 object-cover"
            />
          ) : null}

          <p className="text-body-l mt-6 whitespace-pre-line text-neutral-900">{post.body}</p>

          <div className="mt-8">
            <Link href="/community" className={cn(buttonVariants({ variant: 'outline' }))}>
              {communityPage.post.back}
            </Link>
          </div>
        </article>
      </Section>
    </>
  );
}
