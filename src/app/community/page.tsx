import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { communityPage } from '@/content/community';
import { CommunityFeed } from '@/features/community/community-feed';
import { getCommunityPosts } from '@/features/community/get-community-data';
import { SharePostForm } from '@/features/community/share-post-form';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: communityPage.title,
  description: communityPage.description,
  alternates: { canonical: '/community' },
};

export default async function CommunityPage() {
  const posts = await getCommunityPosts();

  return (
    <>
      <PageHeader
        crumbs={[{ label: communityPage.title }]}
        title={communityPage.title}
        description={communityPage.description}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div>
            <CommunityFeed posts={posts} />
            <div className="mt-10">
              <SharePostForm />
            </div>
          </div>

          <aside>
            <div className="border-primary-100 bg-primary-100/50 rounded-xl border p-5">
              <h2 className="font-heading text-primary-900 text-xl font-semibold">
                Stay in the loop
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Get a short alumni digest by email. No account needed.
              </p>
              <Link
                href="/community/newsletter"
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 h-10 bg-white')}
              >
                Newsletter
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
