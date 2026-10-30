import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SignInGateProps = {
  title: string;
  text: string;
  signInLabel: string;
  registerLabel: string;
  /** `h2` under a page header, `h1` when the gate is the only thing on the page. */
  headingLevel?: 'h1' | 'h2';
  /** Where to come back to after signing in, such as the directory with its filters. */
  next?: string;
  className?: string;
};

/**
 * Shown where a members-only feature would be: a signed-out visitor keeps the page, its
 * heading and its explanation, with the two ways in. Rendered on the server, so the reason
 * is in the HTML rather than arriving after hydration.
 */
export function SignInGate({
  title,
  text,
  signInLabel,
  registerLabel,
  headingLevel = 'h2',
  next,
  className,
}: SignInGateProps) {
  const Heading = headingLevel;
  const signInHref = next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in';
  return (
    <div
      className={cn(
        'mx-auto flex max-w-xl flex-col items-center rounded-xl border border-neutral-300 bg-white px-6 py-10 text-center shadow-sm',
        className,
      )}
    >
      <span className="bg-primary-100 text-primary-700 flex size-12 items-center justify-center rounded-full">
        <LockKeyhole aria-hidden="true" className="size-6" />
      </span>
      <Heading className="font-heading text-primary-900 mt-4 text-2xl font-semibold">
        {' '}
        {title}
      </Heading>
      <p className="mt-2 text-neutral-600">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={signInHref} className={cn(buttonVariants(), 'h-11 px-6 text-base')}>
          {signInLabel}
        </Link>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-6 text-base')}
        >
          {registerLabel}
        </Link>
      </div>
    </div>
  );
}
