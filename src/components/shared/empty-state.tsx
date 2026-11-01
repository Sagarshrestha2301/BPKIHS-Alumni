import { InboxIcon, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  const Icon = icon ?? InboxIcon;
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-neutral-300/80 bg-neutral-100/60 px-6 py-12 text-center shadow-xs',
        className,
      )}
    >
      <div className="bg-primary-100 text-primary-700 ring-primary-700/10 mb-4 flex size-12 items-center justify-center rounded-xl shadow-xs ring-1">
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <p className="font-heading text-primary-900 text-xl font-semibold tracking-tight">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-neutral-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
