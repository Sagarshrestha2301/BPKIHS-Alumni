'use client';

import { CalendarIcon, HeartHandshakeIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

import { focusRing } from './nav-styles';

const items = [
  { label: 'Donate', href: '/donate', icon: HeartHandshakeIcon, donate: true },
  { label: 'Find alumni', href: '/directory', icon: SearchIcon, donate: false },
  { label: 'Events', href: '/events', icon: CalendarIcon, donate: false },
] as const;

export function BottomBar() {
  const pathname = usePathname();
  // The checkout funnel and the admin dashboard have their own full-width controls; a fixed
  // public bar would cover the last action on the page.
  if (pathname.startsWith('/donate/checkout') || pathname.startsWith('/admin')) return null;

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-300 bg-white lg:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ label, href, icon: Icon, donate }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold',
                  focusRing,
                  donate ? 'bg-accent-600 text-white' : 'text-primary-900',
                  !donate && active && 'bg-primary-100',
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
