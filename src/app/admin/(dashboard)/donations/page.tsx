import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { adminDonationsPage, adminPaymentLabels } from '@/content/admin';
import { StatusBadge } from '@/features/admin/status-badge';
import { formatDateTime } from '@/lib/format/dates';
import { formatNpr } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import { listDonationsForAdmin, listGoals } from '@/server/services/donations';

export const metadata: Metadata = { title: adminDonationsPage.title };

const PAGE_SIZE = config.pagination.donationPageSize;

type SearchParams = Promise<{ page?: string }>;

function pageHref(page: number): string {
  return page > 1 ? `/admin/donations?page=${page}` : '/admin/donations';
}

export default async function AdminDonationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  await requireAdminPage();

  const [result, goals] = await Promise.all([
    listDonationsForAdmin({ page, pageSize: PAGE_SIZE }),
    listGoals(),
  ]);
  const goalTitles = new Map(goals.map((goal) => [goal.id, goal.title]));
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-primary-900 text-3xl font-semibold">
            {adminDonationsPage.title}
          </h1>
          <p className="mt-2 text-neutral-600">{adminDonationsPage.description}</p>
        </div>
        <a
          href="/api/v1/admin/donations/export"
          title={adminDonationsPage.exportHint}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 gap-2 px-4')}
        >
          <Download aria-hidden="true" className="size-4" />
          {adminDonationsPage.exportCsv}
        </a>
      </div>

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" title={adminDonationsPage.empty} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-300 bg-white">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <caption className="sr-only">{adminDonationsPage.title}</caption>
            <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminDonationsPage.columns.reference}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminDonationsPage.columns.amount}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminDonationsPage.columns.method}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminDonationsPage.columns.goal}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminDonationsPage.columns.date}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminDonationsPage.columns.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {result.items.map((donation) => (
                <tr key={donation.id}>
                  <td className="px-4 py-3">
                    <span className="text-primary-900 font-mono text-xs">
                      {donation.id.slice(0, 8)}
                    </span>
                    {donation.anonymous ? (
                      <span className="mt-1 block text-xs text-neutral-600">
                        {adminDonationsPage.anonymous}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-primary-900 px-4 py-3 font-medium">
                    {formatNpr(donation.amountMinor)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {adminPaymentLabels[donation.method] ?? donation.method}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {donation.goalId ? (goalTitles.get(donation.goalId) ?? donation.goalId) : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(donation.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={donation.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Donation pages" className="mt-6 flex items-center gap-3">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
            >
              {adminDonationsPage.previous}
            </Link>
          ) : null}
          <span className="text-sm text-neutral-600">
            {adminDonationsPage.pageOf(page, totalPages)}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
            >
              {adminDonationsPage.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
