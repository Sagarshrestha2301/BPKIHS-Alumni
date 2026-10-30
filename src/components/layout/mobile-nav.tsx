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
        className="size-11 lg:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon aria-hidden="true" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
          </SheetHeader>
          <nav aria-label="Mobile" className="px-4">
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
                        'hover:bg-primary-100 flex h-12 items-center rounded-lg px-3 text-lg font-medium text-neutral-900',
                        focusRing,
                        active && 'bg-primary-100 text-primary-900',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-6 grid gap-3 px-4 pb-6">
            <Link href="/donate" onClick={close} className={cn(donateCta, 'h-12 text-base')}>
              Donate
            </Link>
            {signedIn && session ? (
              <Link
                href="/account"
                onClick={close}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-12 px-5 text-base')}
              >
                {session.name}
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={close}
                  className={cn(buttonVariants({ variant: 'outline' }), 'h-12 px-5 text-base')}
                >
                  Register
                </Link>
                <Link
                  href="/sign-in"
                  onClick={close}
                  className={cn(buttonVariants({ variant: 'ghost' }), 'h-12 px-5 text-base')}
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
