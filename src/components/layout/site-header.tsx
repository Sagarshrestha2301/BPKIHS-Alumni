'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { mainNav, site, utilityNav } from '@/content/site';
import { isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

import { Container } from './container';
import { MobileNav } from './mobile-nav';
import { donateCta, focusRing, navLink, navLinkActive } from './nav-styles';

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-300 bg-white">
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
        </Container>
      </div>
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className={cn('flex items-center gap-3 rounded-lg', focusRing)}>
          <Image
            src={site.logo.src}
            alt=""
            width={site.logo.width}
            height={site.logo.height}
            className="size-10"
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
          <ul className="flex items-center gap-1">
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
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-sm')}
          >
            Register
          </Link>
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}
