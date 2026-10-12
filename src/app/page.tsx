import { Suspense } from 'react';

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
    </>
  );
}
