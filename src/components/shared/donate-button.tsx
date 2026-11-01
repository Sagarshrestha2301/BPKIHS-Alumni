import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** The warm Donate colour. It is the only warm element on the site, so it is always findable. */
export const donateClassName =
  'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-700 focus-visible:border-accent-600 focus-visible:ring-accent-600/40 shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-180';

export function DonateButton({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={cn(donateClassName, className)} {...props} />;
}
