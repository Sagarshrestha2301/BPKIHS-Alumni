import Link from 'next/link';
import type { ComponentProps } from 'react';

import { donateClassName } from '@/components/shared/donate-button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** A link that looks like the Donate button (for header, footer and cards). */
export function DonateLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn(buttonVariants(), donateClassName, className)} {...props} />;
}
