import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { communityPage } from '@/content/community';
import { CommunityFeed } from '@/features/community/community-feed';
import { getCommunityPosts } from '@/features/community/get-community-data';
import { ShareGate } from '@/features/community/share-gate';

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
              <Suspense
                fallback={
                  <div
                    aria-hidden="true"
                    className="h-24 animate-pulse rounded-xl border border-neutral-300 bg-neutral-100"
                  />
                }
              >
                <ShareGate />
              </Suspense>
            </div>
          </div>

          <aside className="sticky top-24">
            <div className="from-primary-900 to-primary-700 rounded-xl border-none bg-gradient-to-br p-5 text-white shadow-md">
              <h2 className="font-heading text-xl font-semibold text-white">Stay in the loop</h2>
              <p className="text-primary-100 mt-1 text-sm">
                Get a short alumni digest by email. No account needed.
              </p>
              <Link
                href="/community/newsletter"
                className="text-primary-900 hover:bg-primary-100 mt-4 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold"
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
