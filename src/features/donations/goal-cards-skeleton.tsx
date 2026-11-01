import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading shape for the /donate goal grid, drawn to the real GoalCard's proportions
 * (heading, three lines of description, progress track, full-width button), so nothing
 * jumps when the streamed cards replace it.
 *
 * Four placeholders fill the two-column grid on desktop, the size the real list usually
 * takes; cards land inside their own rows when loaded, so nothing reflows.
 */
export function GoalCardsSkeleton() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="rounded-xl border border-neutral-300 bg-white p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
