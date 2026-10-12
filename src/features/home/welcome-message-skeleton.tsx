import { Section } from '@/components/layout/section';
import { Skeleton } from '@/components/ui/skeleton';

export function WelcomeMessageSkeleton() {
  return (
    <Section tone="tint" aria-hidden="true">
      <Skeleton className="h-56 max-w-3xl rounded-xl" />
    </Section>
  );
}
