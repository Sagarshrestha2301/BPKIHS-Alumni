import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Small uppercase label above a heading. */
export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'text-eyebrow text-primary-700 lg:text-eyebrow-lg font-semibold tracking-[0.08em] uppercase',
        className,
      )}
      {...props}
    />
  );
}
