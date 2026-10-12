import { Skeleton } from '@/components/ui/skeleton';

export function DirectorySkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
