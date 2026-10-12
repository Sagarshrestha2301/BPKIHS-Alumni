import type { ComponentProps, ElementType } from 'react';

import { cn } from '@/lib/utils';

type ContainerProps = ComponentProps<'div'> & {
  as?: 'div' | 'section' | 'main' | 'header' | 'footer' | 'nav';
};

/** Page-width wrapper: max 1200px, side padding 16 / 24 / 32px. */
export function Container({ as, className, ...props }: ContainerProps) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag className={cn('max-w-page mx-auto w-full px-4 md:px-6 lg:px-8', className)} {...props} />
  );
}
