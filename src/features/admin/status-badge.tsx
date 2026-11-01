import { Badge } from '@/components/ui/badge';
import { adminStatusLabels } from '@/content/admin';
import { cn } from '@/lib/utils';

const TONES: Record<string, string> = {
  pending: 'border-warning-600/30 bg-warning-600/10 text-warning-600',
  approved: 'border-success-600/30 bg-success-600/10 text-success-600',
  succeeded: 'border-success-600/30 bg-success-600/10 text-success-600',
  closed: 'border-neutral-300 bg-neutral-100 text-neutral-600',
  dismissed: 'border-neutral-300 bg-neutral-100 text-neutral-600',
  rejected: 'border-danger-600/30 bg-danger-600/10 text-danger-600',
  failed: 'border-danger-600/30 bg-danger-600/10 text-danger-600',
  open: 'border-accent-600/30 bg-accent-100 text-accent-700',
  in_progress: 'border-primary-700/30 bg-primary-100 text-primary-700',
  reviewed: 'border-primary-700/30 bg-primary-100 text-primary-700',
};

const DOTS: Record<string, string> = {
  pending: 'bg-warning-600',
  approved: 'bg-success-600',
  succeeded: 'bg-success-600',
  closed: 'bg-neutral-500',
  dismissed: 'bg-neutral-500',
  rejected: 'bg-danger-600',
  failed: 'bg-danger-600',
  open: 'bg-accent-600',
  in_progress: 'bg-primary-700',
  reviewed: 'bg-primary-700',
};

/** Status is never shown by colour alone: the label is always there. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium shadow-2xs',
        TONES[status] ?? TONES.closed,
        className,
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', DOTS[status] ?? 'bg-neutral-500')}
        aria-hidden="true"
      />
      {adminStatusLabels[status] ?? status}
    </Badge>
  );
}
