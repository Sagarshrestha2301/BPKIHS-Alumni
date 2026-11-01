import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for the notice board popup while loading. */
export function NoticeBoardSkeleton() {
  return <Skeleton className="h-96 rounded-lg p-8" />;
}
