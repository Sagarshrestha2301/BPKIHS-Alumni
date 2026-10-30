import { ArrowUpRight, CheckCircle2, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { adminOverview as copy } from '@/content/admin';
import { AdminBarChart } from '@/features/admin/bar-chart';
import { AdminPageHeader } from '@/features/admin/page-header';
import { formatDate } from '@/lib/format/dates';
import { formatNpr, formatNprCompact } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { getRegistrationMonths } from '@/server/services/admin-dashboard';
import { listAlumniForAdmin } from '@/server/services/alumni';
import { listOpenReports, listPendingPosts } from '@/server/services/community';
import { getAdminCounts, getSiteStats } from '@/server/services/content';
import { getAdminGivingSummary } from '@/server/services/donations';
import { subscriberTotals } from '@/server/services/newsletter';
import { listTicketsForAdmin } from '@/server/services/support';

export const metadata: Metadata = { title: copy.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

/** How many rows each "latest" column shows before the See all link. */
const RECENT_LIMIT = 4;

type RecentItem = { id: string; label: string; meta: string };

/** KPI card component with emphasis variant. */
function KpiCard({
  label,
  value,
  detail,
  href,
  emphasis,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
  emphasis: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col rounded-xl border p-5 shadow-sm transition-colors',
        emphasis
          ? 'border-primary-900 bg-primary-900 hover:bg-primary-700 text-white'
          : 'hover:border-primary-700 border-neutral-300 bg-white',
      )}
    >
      <span className={cn('text-sm', emphasis ? 'text-white/70' : 'text-neutral-600')}>
        {label}
      </span>
      <strong
        className={cn(
          'font-heading mt-2 block text-2xl font-semibold',
          emphasis ? 'text-white' : 'text-primary-900',
        )}
      >
        {value}
      </strong>
      <span className={cn('mt-1 block text-xs', emphasis ? 'text-white/70' : 'text-neutral-600')}>
        {detail}
      </span>
    </Link>
  );
}

/** Recent item column component. */
function RecentColumn({
  title,
  href,
  count,
  items,
}: {
  title: string;
  href: string;
  count: number;
  items: RecentItem[];
}) {
  return (
    <div className="rounded-xl border border-neutral-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-primary-900 text-sm font-semibold">
          {title}
          {count > 0 && (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-neutral-100 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-neutral-700">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </h3>
        <Link
          href={href}
          className="text-primary-700 shrink-0 text-sm underline underline-offset-4"
        >
          {copy.recent.viewAll}
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={copy.recent.empty}
          description={title.toLowerCase() + ' ' + copy.recent.empty.toLowerCase()}
          icon={Users}
        />
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={href}
                className="hover:border-primary-700 flex items-start justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 transition-colors"
              >
                <span className="min-w-0">
                  <span className="text-primary-900 block truncate text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="block text-xs text-neutral-600">{item.meta}</span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-neutral-400"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdminPage();

  const [counts, stats, subscribers, giving, registrations, pending, posts, tickets, reports] =
    await Promise.all([
      getAdminCounts(),
      getSiteStats(),
      subscriberTotals(),
      getAdminGivingSummary(),
      getRegistrationMonths(),
      listAlumniForAdmin({ status: 'pending', pageSize: RECENT_LIMIT }),
      listPendingPosts(RECENT_LIMIT),
      listTicketsForAdmin('open', RECENT_LIMIT),
      listOpenReports(RECENT_LIMIT),
    ]);

  // Check if all data sections are empty
  const allQueuesEmpty =
    counts.pendingAlumni === 0 &&
    counts.pendingPosts === 0 &&
    counts.openReports === 0 &&
    counts.openTickets === 0;
  const allKpisEmpty =
    !giving.thisMonthGifts && subscribers.subscribed === 0 && stats.alumniCount === 0;

  const queues: Record<string, number> = {
    pendingAlumni: counts.pendingAlumni,
    pendingPosts: counts.pendingPosts,
    openReports: counts.openReports,
    openTickets: counts.openTickets,
  };

  const waiting = Object.values(queues).reduce((sum, value) => sum + value, 0);
  const activeQueues = copy.attention.items.filter((item) => (queues[item.key] ?? 0) > 0).length;

  // The giving window is exactly six months, current month last; the one before it is the
  // comparison for the month-on-month figure.
  const thisMonth = giving.months[giving.months.length - 1];
  const lastMonth = giving.months[giving.months.length - 2];
  const thisMonthMinor = thisMonth?.raisedMinor ?? 0;
  const lastMonthMinor = lastMonth?.raisedMinor ?? 0;
  const deltaPercent =
    lastMonthMinor > 0 ? Math.round(((thisMonthMinor - lastMonthMinor) / lastMonthMinor) * 100) : 0;
  const delta =
    lastMonthMinor > 0
      ? deltaPercent === 0
        ? copy.kpis.flat
        : copy.kpis.vsLastMonth(deltaPercent)
      : thisMonthMinor > 0
        ? copy.kpis.noBaseline
        : copy.kpis.flat;

  const addedThisMonth = registrations[registrations.length - 1]?.added ?? 0;
  const averageGift =
    giving.thisMonthGifts > 0 ? Math.round(thisMonthMinor / giving.thisMonthGifts) : 0;

  const recentColumns = [
    {
      key: 'registrations',
      title: copy.recent.registrations,
      href: '/admin/alumni?status=pending',
      count: counts.pendingAlumni,
      items: pending.items.map<RecentItem>((person) => ({
        id: person.id,
        label: person.fullName,
        meta: `${person.programme}, batch ${person.batchYear}`,
      })),
    },
    {
      key: 'posts',
      title: copy.recent.posts,
      href: '/admin/posts',
      count: counts.pendingPosts,
      items: posts.slice(0, RECENT_LIMIT).map<RecentItem>((post) => ({
        id: post.id,
        label: post.title,
        meta: `Submitted ${formatDate(post.createdAt)}`,
      })),
    },
    {
      key: 'reports',
      title: copy.recent.reports,
      href: '/admin/reports',
      count: counts.openReports,
      items: reports.map<RecentItem>((report) => ({
        id: report.id,
        label: report.postTitle,
        meta: `${report.reason.replaceAll('_', ' ')} · ${formatDate(report.createdAt)}`,
      })),
    },
    {
      key: 'tickets',
      title: copy.recent.tickets,
      href: '/admin/tickets?status=open',
      count: counts.openTickets,
      items: tickets.slice(0, RECENT_LIMIT).map<RecentItem>((ticket) => ({
        id: ticket.id,
        label: ticket.subject,
        meta: `${ticket.reference} · ${formatDate(ticket.createdAt)}`,
      })),
    },
  ] as const;

  const kpis = [
    {
      key: 'month',
      label: copy.kpis.thisMonth,
      value: formatNpr(thisMonthMinor),
      detail: delta,
      href: '/admin/donations?status=succeeded',
      emphasis: true,
    },
    {
      key: 'alumni',
      label: copy.kpis.alumni,
      value: stats.alumniCount.toLocaleString('en-US'),
      detail: addedThisMonth > 0 ? copy.kpis.alumniNew(addedThisMonth) : copy.kpis.alumniNone,
      href: '/admin/alumni?status=approved',
      emphasis: false,
    },
    {
      key: 'subscribers',
      label: copy.kpis.subscribers,
      value: subscribers.subscribed.toLocaleString('en-US'),
      detail:
        subscribers.pending > 0
          ? copy.kpis.subscribersPending(subscribers.pending)
          : copy.kpis.subscribersNone,
      href: '/admin/newsletter?status=subscribed',
      emphasis: false,
    },
    {
      key: 'average',
      label: copy.kpis.average,
      value: averageGift > 0 ? formatNpr(averageGift) : 'N/A',
      detail: copy.kpis.averageNote,
      href: '/admin/donations?status=succeeded',
      emphasis: false,
    },
  ] as const;

  return (
    <div className="space-y-9">
      <AdminPageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <span className="text-sm text-neutral-600">
            {copy.asOf(formatDate(new Date().toISOString()))}
          </span>
        }
      />

      <nav aria-label={copy.quickActionsTitle} className="-mt-3">
        <ul className="flex flex-wrap gap-2">
          {copy.quickActions.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="hover:border-primary-700 hover:text-primary-900 inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors"
              >
                {action.label}
                <ArrowUpRight aria-hidden="true" className="size-3.5 text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="attention-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="attention-heading"
            className="font-heading text-primary-900 text-xl font-semibold"
          >
            {copy.attention.title}
          </h2>
          <p
            className={cn(
              'text-sm',
              waiting > 0 ? 'text-warning-600 font-medium' : 'text-neutral-600',
            )}
          >
            {waiting > 0 ? copy.attention.summary(waiting) : copy.attention.clear}
          </p>
        </div>

        {waiting === 0 ? (
          <p className="mt-3 flex items-start gap-3 rounded-xl border border-neutral-300 bg-white p-5 text-neutral-600">
            <CheckCircle2 aria-hidden="true" className="text-success-600 mt-0.5 size-5 shrink-0" />
            {copy.empty}
          </p>
        ) : (
          <ul
            className={cn(
              'mt-3 grid gap-3 sm:grid-cols-2',
              activeQueues > 2 ? 'xl:grid-cols-4' : 'xl:grid-cols-2',
            )}
          >
            {copy.attention.items.map((item) => {
              const value = queues[item.key] ?? 0;
              // A zero queue is good news, but an actionable tile that only says "0" is noise.
              if (value === 0) return null;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="group hover:border-primary-700 flex h-full flex-col justify-between rounded-xl border border-neutral-300 bg-white p-5 shadow-sm transition-colors"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-primary-900 font-heading text-3xl font-semibold">
                        {value.toLocaleString('en-US')}
                      </span>
                      <span className="group-hover:text-primary-700 flex items-center gap-1 text-xs font-medium text-neutral-600">
                        {item.action}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </span>
                    </span>
                    <span className="mt-2 block text-sm">
                      <span className="text-primary-900 block font-medium">{item.label}</span>
                      <span className="text-neutral-600">{item.detail}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* KPIs section */}
      {allKpisEmpty ? (
        <EmptyState
          title={copy.kpis.alumni}
          description={copy.kpis.subscribersNone}
          icon={CheckCircle2}
        />
      ) : (
        <section aria-label={copy.kpisLabel} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              detail={kpi.detail}
              href={kpi.href}
              emphasis={kpi.emphasis}
            />
          ))}
        </section>
      )}

      {/* Charts section */}
      {allQueuesEmpty ? (
        <EmptyState
          title={copy.charts.givingEmpty}
          description={copy.charts.registrationEmpty}
          icon={Users}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminBarChart
            className="lg:col-span-2"
            title={copy.charts.givingTitle}
            description={copy.charts.givingDescription}
            data={giving.months.map((month) => ({
              key: month.key,
              label: month.label,
              value: month.raisedMinor,
            }))}
            formatValue={(value) => formatNprCompact(value)}
            formatAxis={(value) => formatNprCompact(value).replace('NPR ', '')}
            empty={copy.charts.givingEmpty}
            tableCaption={copy.charts.givingTable}
            labels={{ month: copy.charts.month, value: copy.charts.amount }}
          />

          <AdminBarChart
            title={copy.charts.registrationTitle}
            description={copy.charts.registrationDescription}
            data={registrations.map((month) => ({
              key: month.key,
              label: month.label,
              value: month.added,
              secondary: month.pending,
            }))}
            formatValue={(value) => value.toLocaleString('en-US')}
            empty={copy.charts.registrationEmpty}
            tableCaption={copy.charts.registrationTable}
            labels={{
              month: copy.charts.month,
              value: copy.charts.added,
              secondary: copy.charts.pending,
            }}
            primaryLabel={copy.charts.added}
            secondaryLabel={copy.charts.pending}
          />
        </div>
      )}

      <p className="text-xs text-neutral-600">{copy.charts.note}</p>

      {/* Recent items section */}
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="font-heading text-primary-900 text-xl font-semibold">
          {copy.recentTitle}
        </h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {recentColumns.map((column) => (
            <RecentColumn
              key={column.key}
              title={column.title}
              href={column.href}
              count={column.count}
              items={column.items}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
