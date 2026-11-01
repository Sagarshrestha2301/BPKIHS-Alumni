'use client';

import {
  CreditCard,
  FileText,
  Flag,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  type LucideIcon,
  Mail,
  Newspaper,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { adminNavGroups, adminShell } from '@/content/admin';
import { cn } from '@/lib/utils';

/** Live queue totals, fetched once by the admin layout. */
export interface AdminNavCounts {
  pendingAlumni: number;
  pendingPosts: number;
  openReports: number;
  openTickets: number;
}

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  registrations: Users,
  posts: Newspaper,
  reports: Flag,
  support: LifeBuoy,
  donations: HeartHandshake,
  payments: CreditCard,
  newsletter: Mail,
  content: FileText,
  audit: ScrollText,
  security: ShieldCheck,
};

/**
 * Grouped, not alphabetical: moderation sits together, money sits together, housekeeping
 * sits out of the way. The count beside an item is the live queue, so the sidebar doubles
 * as the day’s to-do list.
 */
export function AdminNav({ counts }: { counts: AdminNavCounts }) {
  const pathname = usePathname();

  return (
    <nav aria-label={adminShell.navLabel} className="space-y-6">
      {adminNavGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[0.6875rem] font-semibold tracking-[0.12em] text-neutral-500 uppercase">
            {group.label}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const active =
                'exact' in item && item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = ICONS[item.icon] ?? FileText;
              const badge = 'badge' in item ? counts[item.badge] : 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-180',
                      active
                        ? 'bg-primary-100 text-primary-900 font-semibold shadow-xs'
                        : 'hover:text-primary-900 font-medium text-neutral-700 hover:bg-neutral-200/60',
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        'size-4 shrink-0',
                        active
                          ? 'text-primary-700'
                          : 'group-hover:text-primary-700 text-neutral-500',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {badge > 0 ? (
                      <span className="bg-primary-700 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
