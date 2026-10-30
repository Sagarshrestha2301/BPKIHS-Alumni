import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';

export function CommunityPostsSkeleton() {
  return (
    <Section tone="muted" aria-hidden="true">
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Skeleton key={n} className="h-96 rounded-xl" />
        ))}
      </div>
    </Section>
  );
}
