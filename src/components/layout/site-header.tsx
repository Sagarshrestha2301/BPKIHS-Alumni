'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { mainNav, signInHref, signInLabel, site, utilityNav } from '@/content/site';
import { useSession } from '@/features/auth/session-provider';
import { isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

import { Container } from './container';
import { MobileNav } from './mobile-nav';
import { donateCta, focusRing, navLink, navLinkActive } from './nav-styles';

export function SiteHeader() {
  const pathname = usePathname();
  const { status, session } = useSession();
  const signedIn = status === 'signed_in';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The dashboard has its own shell: no public banner above it.
  if (pathname.startsWith('/admin')) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-200',
        scrolled
          ? 'border-b border-neutral-300/80 bg-white/95 shadow-xs backdrop-blur-md'
          : 'border-b border-neutral-300 bg-white',
      )}
    >
      <div className="bg-primary-900 hidden text-sm text-white lg:block">
        <Container className="flex items-center justify-end gap-6 py-1.5">
          <a
            href={site.instituteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('underline-offset-4 hover:underline', focusRing)}
          >
            BPKIHS website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {utilityNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn('underline-offset-4 hover:underline', focusRing)}
            >
              {item.label}
            </Link>
          ))}
          {signedIn && session ? (
            <Link
              href="/account"
              aria-current={isActivePath(pathname, '/account') ? 'page' : undefined}
              className={cn('font-semibold underline-offset-4 hover:underline', focusRing)}
            >
              {session.name}
            </Link>
          ) : (
            <Link href={signInHref} className={cn('underline-offset-4 hover:underline', focusRing)}>
              {signInLabel}
            </Link>
          )}
        </Container>
      </div>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className={cn(
            'group flex items-center gap-3 rounded-lg transition-opacity hover:opacity-95',
            focusRing,
          )}
        >
          <Image
            src={site.logo.src}
            alt=""
            width={site.logo.width}
            height={site.logo.height}
            className="size-10 transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-primary-900 text-base font-bold sm:text-lg">
              {site.name}
            </span>
            <span className="hidden text-xs text-neutral-600 sm:block">{site.instituteName}</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1.5">
            {mainNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(navLink, active && navLinkActive)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/donate" className={donateCta}>
            Donate
          </Link>
          {/* Register is meaningless to someone who already has an account. */}
          {signedIn ? null : (
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-10 px-4 text-sm font-medium',
              )}
            >
              Register
            </Link>
          )}
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}
