import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type StatCardProps = {
  value: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
};

export function StatCard({ value, label, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-neutral-300 bg-white p-6 shadow-sm', className)}>
      {Icon ? <Icon aria-hidden="true" className="text-primary-700 mb-3 size-6" /> : null}
      <p className="font-heading text-primary-900 text-3xl font-bold md:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-neutral-600">{label}</p>
    </div>
  );
}
