import type { Metadata } from 'next';
import { Suspense } from 'react';

import { site } from '@/content/site';
import { BoardPreview } from '@/features/home/board-preview';
import { BoardPreviewSkeleton } from '@/features/home/board-preview-skeleton';
import { CommunityPosts } from '@/features/home/community-posts';
import { CommunityPostsSkeleton } from '@/features/home/community-posts-skeleton';
import { FeaturedGoals } from '@/features/home/featured-goals';
import { FeaturedGoalsSkeleton } from '@/features/home/featured-goals-skeleton';
import { Hero } from '@/features/home/hero';
import { PartnerStrip } from '@/features/home/partner-strip';
import { StatsBand } from '@/features/home/stats-band';
import { StatsBandSkeleton } from '@/features/home/stats-band-skeleton';
import { ThreeDoors } from '@/features/home/three-doors';
import { UpcomingEvents } from '@/features/home/upcoming-events';
import { UpcomingEventsSkeleton } from '@/features/home/upcoming-events-skeleton';
import { WelcomeMessageSection } from '@/features/home/welcome-message';
import { WelcomeMessageSkeleton } from '@/features/home/welcome-message-skeleton';

const description =
  'Find fellow BPKIHS alumni, give back to the institute and join events. The lifelong network of B.P. Koirala Institute of Health Sciences graduates.';

export const metadata: Metadata = {
  title: { absolute: site.name },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title: site.name,
    description,
    url: '/',
    siteName: site.name,
    locale: 'en_NP',
    type: 'website',
    images: [
      {
        url: site.logo.src,
        width: site.logo.width,
        height: site.logo.height,
        alt: `${site.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: site.name,
    description,
    images: [site.logo.src],
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<StatsBandSkeleton />}>
        <StatsBand />
      </Suspense>
      <ThreeDoors />
      <Suspense fallback={<FeaturedGoalsSkeleton />}>
        <FeaturedGoals />
      </Suspense>
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <UpcomingEvents />
      </Suspense>
      <Suspense fallback={<CommunityPostsSkeleton />}>
        <CommunityPosts />
      </Suspense>
      <Suspense fallback={<BoardPreviewSkeleton />}>
        <BoardPreview />
      </Suspense>
      <Suspense fallback={<WelcomeMessageSkeleton />}>
        <WelcomeMessageSection />
      </Suspense>
      <PartnerStrip />
    </>
  );
}
