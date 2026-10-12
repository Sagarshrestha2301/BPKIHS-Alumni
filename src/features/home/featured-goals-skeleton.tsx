import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';

/** Same grid as the real section, so nothing jumps when it loads. */
export function FeaturedGoalsSkeleton() {
  return (
    <Section tone="muted" aria-hidden="true">
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Skeleton key={n} className="h-72 rounded-xl" />
        ))}
      </div>
    </Section>
  );
}
