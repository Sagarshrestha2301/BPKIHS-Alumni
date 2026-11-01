'use client';

import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { signInPage } from '@/content/account';
import { mainNav } from '@/content/site';
import { useSession } from '@/features/auth/session-provider';
import { isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

import { donateCta, focusRing } from './nav-styles';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { status, session } = useSession();
  const signedIn = status === 'signed_in';
  const close = () => setOpen(false);

  return (
    <>
      <Button
        variant="outline"
        className="btn-press size-10 lg:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon aria-hidden="true" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="shadow-floating flex w-full flex-col border-l border-neutral-200/80 bg-white/98 p-0 backdrop-blur-xl sm:max-w-sm"
        >
          <SheetHeader className="border-b border-neutral-200/60 p-5 text-left">
            <SheetTitle className="font-heading text-primary-900 text-lg font-bold">
              BPKIHS Alumni
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-500">
              Dharan, Nepal • Lifelong Community
            </SheetDescription>
          </SheetHeader>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-4">
            <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              Navigation
            </p>
            <ul className="space-y-1">
              {mainNav.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-11 items-center justify-between rounded-xl px-3.5 text-base font-medium transition-all duration-180',
                        focusRing,
                        active
                          ? 'bg-primary-100 text-primary-900 font-semibold shadow-xs'
                          : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900',
                      )}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span className="bg-primary-700 size-1.5 rounded-full" aria-hidden="true" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="grid gap-2.5 border-t border-neutral-200/60 bg-neutral-50/50 p-4 pb-6">
            <Link
              href="/donate"
              onClick={close}
              className={cn(donateCta, 'h-11 text-base shadow-xs')}
            >
              Donate
            </Link>
            {signedIn && session ? (
              <Link
                href="/account"
                onClick={close}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
              >
                {session.name}
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={close}
                  className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
                >
                  Register
                </Link>
                <Link
                  href="/sign-in"
                  onClick={close}
                  className={cn(buttonVariants({ variant: 'ghost' }), 'h-11 px-5 text-base')}
                >
                  {signInPage.title}
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
