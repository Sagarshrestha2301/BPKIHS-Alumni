'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { adminNav } from '@/content/admin';
import { cn } from '@/lib/utils';

/** Horizontal on every screen: six short labels scroll better than a drawer. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 py-2">
        {adminNav.map((item) => {
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap',
                  active
                    ? 'bg-primary-100 text-primary-900'
                    : 'hover:text-primary-900 text-neutral-600 hover:bg-neutral-100',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
