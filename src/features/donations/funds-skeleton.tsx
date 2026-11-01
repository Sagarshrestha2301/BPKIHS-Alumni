import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading shape for the /donate funds breakdown: one row per category with a category line
 * and the share bar the real rows draw. An empty state fades in if the table is actually
 * empty, so this only needs to cover the "rows are coming" case.
 */
export function FundsSkeleton() {
  return (
    <div className="mt-8 grid gap-3" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <div
          key={n}
          className="grid gap-2 rounded-lg border border-neutral-300 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-2 w-full max-w-md rounded-full" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
