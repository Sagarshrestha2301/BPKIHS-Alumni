import { Skeleton } from '@/components/ui/skeleton';

/** Occupies the exact spot the finished panel takes on an xl screen, but inert. */
export function NoticeBoardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-1/2 right-4 z-40 hidden w-72 -translate-y-1/2 xl:block"
    >
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
