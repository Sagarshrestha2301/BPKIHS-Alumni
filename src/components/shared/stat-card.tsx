import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type StatCardProps = {
  /** Plain text, or a node (a `CountUp` span) when the number animates. */
  value: ReactNode;
  label: string;
  icon?: LucideIcon;
  className?: string;
};

/** One number with its label: crafted editorial card with responsive micro-interactions. */
export function StatCard({ value, label, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group card-lift hover:border-primary-300/70 hover:shadow-card-hover relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-300/80 bg-white p-6 shadow-xs transition-all duration-240',
        className,
      )}
    >
      <div>
        {Icon ? (
          <div className="bg-primary-100 text-primary-700 group-hover:bg-primary-200/90 mb-4 flex size-11 items-center justify-center rounded-xl shadow-xs transition-all duration-240 ease-out group-hover:scale-108 group-hover:shadow-sm">
            <Icon
              aria-hidden="true"
              className="size-5 transition-transform duration-240 ease-out group-hover:rotate-[-4deg]"
            />
          </div>
        ) : null}
        <p className="font-heading text-primary-900 text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
          {value}
        </p>
      </div>
      <p className="mt-2 text-sm font-medium text-neutral-600 transition-colors duration-180 group-hover:text-neutral-900">
        {label}
      </p>
    </div>
  );
}
