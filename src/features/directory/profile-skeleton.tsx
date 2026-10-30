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
        <div className="mx-auto max-w-5xl">
          <Skeleton className="h-4 w-36" />
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-8">
            <Skeleton className="h-96 w-full rounded-xl" />
            <div className="grid gap-5">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
