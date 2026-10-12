import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';

export function UpcomingEventsSkeleton() {
  return (
    <Section aria-hidden="true">
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Skeleton key={n} className="h-44 rounded-xl" />
        ))}
      </div>
    </Section>
  );
}
