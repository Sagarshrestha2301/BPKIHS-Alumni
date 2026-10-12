import { Suspense } from 'react';

import { FeaturedGoals } from '@/features/home/featured-goals';
import { FeaturedGoalsSkeleton } from '@/features/home/featured-goals-skeleton';
import { Hero } from '@/features/home/hero';
import { StatsBand } from '@/features/home/stats-band';
import { StatsBandSkeleton } from '@/features/home/stats-band-skeleton';
import { ThreeDoors } from '@/features/home/three-doors';

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
    </>
  );
}
