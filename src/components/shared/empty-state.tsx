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
        'flex flex-col items-center rounded-xl border border-dashed border-neutral-300 bg-neutral-100 px-6 py-12 text-center',
        className,
      )}
    >
      <Icon aria-hidden="true" className="mb-4 size-8 text-neutral-600" />
      <p className="text-primary-900 text-lg font-semibold">{title}</p>
      {description ? <p className="mt-1 max-w-md text-neutral-600">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
