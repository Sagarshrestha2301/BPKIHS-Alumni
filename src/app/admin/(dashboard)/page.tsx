import type { Metadata } from 'next';
import Link from 'next/link';

import { adminOverview } from '@/content/admin';
import { formatNprCompact } from '@/lib/format/money';
import { requireAdminPage } from '@/server/auth/admin-page';
import { getAdminCounts, getSiteStats } from '@/server/services/content';
import { countSubscribers } from '@/server/services/newsletter';

export const metadata: Metadata = { title: adminOverview.title };

export default async function AdminOverviewPage() {
  await requireAdminPage();

  const [counts, stats, subscribers] = await Promise.all([
    getAdminCounts(),
    getSiteStats(),
    countSubscribers(),
  ]);

  const queues: Record<string, number> = {
    pendingAlumni: counts.pendingAlumni,
    pendingPosts: counts.pendingPosts,
    openReports: counts.openReports,
    openTickets: counts.openTickets,
  };

  const numbers: Record<string, number> = {
    alumniCount: stats.alumniCount,
    subscribers,
    raisedMinor: stats.raisedMinor,
    countries: stats.countries ?? 0,
  };

  const waiting = Object.values(queues).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-primary-900 text-3xl font-semibold">
          {adminOverview.title}
        </h1>
        <p className="mt-2 text-neutral-600">{adminOverview.description}</p>
      </div>

      <section aria-labelledby="admin-queues">
        <h2 id="admin-queues" className="font-heading text-primary-900 text-xl font-semibold">
          {adminOverview.queuesTitle}
        </h2>
        {waiting === 0 ? (
          <p className="mt-3 rounded-xl border border-neutral-300 bg-white p-5 text-neutral-600">
            {adminOverview.empty}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {adminOverview.queues.map((queue) => {
              const value = queues[queue.key] ?? 0;
              return (
                <li key={queue.key}>
                  <Link
                    href={queue.href}
                    className="hover:border-primary-700 block rounded-xl border border-neutral-300 bg-white p-5 shadow-sm transition-colors"
                  >
                    <span className="text-primary-900 font-heading block text-3xl font-semibold">
                      {value}
                    </span>
                    <span className="mt-1 block text-sm text-neutral-600">{queue.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="admin-numbers">
        <h2 id="admin-numbers" className="font-heading text-primary-900 text-xl font-semibold">
          {adminOverview.numbersTitle}
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {adminOverview.numbers.map((item) => {
            const value = numbers[item.key] ?? 0;
            return (
              <div key={item.key} className="rounded-xl border border-neutral-300 bg-white p-5">
                <dt className="text-sm text-neutral-600">{item.label}</dt>
                <dd className="text-primary-900 mt-1 text-2xl font-semibold">
                  {'money' in item ? formatNprCompact(value) : value.toLocaleString('en-US')}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
