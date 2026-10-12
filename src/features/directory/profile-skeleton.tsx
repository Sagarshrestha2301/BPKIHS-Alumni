import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="bg-secondary border-b border-neutral-300 py-8 lg:py-12">
        <Container>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-4 h-10 w-80 max-w-full" />
        </Container>
      </div>
      <Container className="py-10">
        <Skeleton className="h-72 w-full rounded-xl" />
      </Container>
    </div>
  );
}
