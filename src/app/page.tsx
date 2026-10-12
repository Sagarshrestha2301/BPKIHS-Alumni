import { Suspense } from 'react';

import { CommunityPosts } from '@/features/home/community-posts';
import { CommunityPostsSkeleton } from '@/features/home/community-posts-skeleton';
import { FeaturedGoals } from '@/features/home/featured-goals';
import { FeaturedGoalsSkeleton } from '@/features/home/featured-goals-skeleton';
import { Hero } from '@/features/home/hero';
import { StatsBand } from '@/features/home/stats-band';
import { StatsBandSkeleton } from '@/features/home/stats-band-skeleton';
import { ThreeDoors } from '@/features/home/three-doors';
import { UpcomingEvents } from '@/features/home/upcoming-events';
import { UpcomingEventsSkeleton } from '@/features/home/upcoming-events-skeleton';

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
    </>
  );
}
