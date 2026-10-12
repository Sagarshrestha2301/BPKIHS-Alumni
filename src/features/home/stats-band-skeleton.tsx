import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';

/** Same grid and card height as the real band, so nothing jumps when it loads. */
export function StatsBandSkeleton() {
  return (
    <Section tone="tint" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-36 rounded-xl" />
        ))}
      </div>
    </Section>
  );
}
