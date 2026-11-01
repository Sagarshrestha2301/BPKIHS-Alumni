import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
import { PulseLine } from '@/components/shared/pulse-line';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { featuredGoals } from '@/content/home';
import { GoalCard, type GoalCardStats } from '@/features/donations/goal-card';
import type { DonationGoal } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** Hides itself when there are no goals, so the page never shows an empty block. */
export function FeaturedGoalsView({
  goals,
  giftStats,
  now,
}: {
  goals: DonationGoal[];
  /** Give counts per goal id; omitted in tests and wherever the ledger is not read. */
  giftStats?: Record<string, GoalCardStats>;
  /** A prerender-safe clock from `getCachedNow()`; omitted in browser tests. */
  now?: Date;
}) {
  if (goals.length === 0) return null;

  return (
    <Section tone="muted" aria-label={featuredGoals.title}>
      {/* The pulse stroke is this section's mark: a gift is the beat the goals live on. */}
      <SectionHeading
        eyebrow={featuredGoals.eyebrow}
        title={featuredGoals.title}
        description={featuredGoals.description}
        accent={<PulseLine className="hidden lg:block" />}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} stats={giftStats?.[goal.id]} now={now} />
        ))}
      </div>
      <div className="mt-8">
        <Link
          href={featuredGoals.allGoalsHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
        >
          {featuredGoals.allGoalsLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
