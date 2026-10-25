import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { featuredGoals } from '@/content/home';
import { GoalCard } from '@/features/donations/goal-card';
import type { DonationGoal } from '@/lib/api/types';
import { cn } from '@/lib/utils';

/** Hides itself when there are no goals, so the page never shows an empty block. */
export function FeaturedGoalsView({ goals }: { goals: DonationGoal[] }) {
  if (goals.length === 0) return null;

  return (
    <Section tone="muted" aria-label={featuredGoals.title}>
      <SectionHeading
        eyebrow={featuredGoals.eyebrow}
        title={featuredGoals.title}
        description={featuredGoals.description}
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
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
