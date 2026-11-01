import { cn } from '@/lib/utils';

type ProgressBarProps = {
  label: string;
  raised: number;
  target: number;
  raisedLabel: string;
  targetLabel: string;
  supporters?: number;
  className?: string;
};

export function getPercent(raised: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / target) * 100)));
}

export function ProgressBar({
  label,
  raised,
  target,
  raisedLabel,
  targetLabel,
  supporters,
  className,
}: ProgressBarProps) {
  const percent = getPercent(raised, target);
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-primary-900 font-semibold">{raisedLabel} raised</span>
        <span className="text-neutral-600">of {targetLabel}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}% of goal`}
        className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200/80 shadow-inner"
      >
        <div
          className="from-primary-700 via-primary-600 to-primary-500 h-full rounded-full bg-linear-to-r shadow-xs transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-neutral-600">
        {percent}% funded
        {supporters !== undefined ? ` · ${supporters} supporters` : ''}
      </p>
    </div>
  );
}
