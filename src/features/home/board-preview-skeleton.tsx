import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';

export function BoardPreviewSkeleton() {
  return (
    <Section aria-hidden="true">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-28 rounded-xl" />
        ))}
      </div>
    </Section>
  );
}
