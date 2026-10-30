import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { adminDonationsPage, adminPaymentLabels, adminStatusLabels } from '@/content/admin';
import { AdminPageHeader } from '@/features/admin/page-header';
import { StatusBadge } from '@/features/admin/status-badge';
import { formatDateTime } from '@/lib/format/dates';
import { formatNpr } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import {
  DONATION_STATUSES,
  type DonationExportStatus,
  getAdminGivingSummary,
  listDonationsForAdmin,
} from '@/server/services/donations';

export const metadata: Metadata = { title: adminDonationsPage.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

const PAGE_SIZE = config.pagination.donationPageSize;

type SearchValue = string | string[] | undefined;
type SearchParams = Promise<{ page?: SearchValue; status?: SearchValue; q?: SearchValue }>;

function firstValue(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(page: number, status?: DonationExportStatus, query?: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (status) params.set('status', status);
  if (query) params.set('q', query);
  const search = params.toString();
  return search ? `/admin/donations?${search}` : '/admin/donations';
}

export default async function AdminDonationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(firstValue(params.page)) || 1);
  const requestedStatus = firstValue(params.status);
  const status = DONATION_STATUSES.find((value) => value === requestedStatus);
  const query = firstValue(params.q)?.trim().slice(0, 100) ?? '';
  await requireAdminPage();

  const [result, giving] = await Promise.all([
    listDonationsForAdmin({ page: requestedPage, pageSize: PAGE_SIZE, status, q: query }),
    getAdminGivingSummary(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const page = Math.min(requestedPage, totalPages);

  const exportQuery = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(query ? { q: query } : {}),
  }).toString();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={adminDonationsPage.title}
        description={adminDonationsPage.description}
        actions={
          <a
            href={`/api/v1/admin/donations/export${exportQuery ? `?${exportQuery}` : ''}`}
            title={adminDonationsPage.exportHint}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-10 gap-2 px-4')}
          >
            <Download aria-hidden="true" className="size-4" />
            {adminDonationsPage.exportCsv}
          </a>
        }
      />

      <form
        method="get"
        className="grid gap-3 rounded-xl border border-neutral-300 bg-white p-4 shadow-sm sm:grid-cols-[minmax(12rem,1fr)_12rem_auto_auto] sm:items-end"
      >
        <div className="space-y-1.5">
          <label htmlFor="donation-search" className="text-sm font-medium text-neutral-800">
            {adminDonationsPage.searchLabel}
          </label>
          <input
            id="donation-search"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={query}
            className="focus-visible:outline-primary-700 h-11 w-full rounded-lg border border-neutral-400 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="donation-status" className="text-sm font-medium text-neutral-800">
            {adminDonationsPage.statusLabel}
          </label>
          <select
            id="donation-status"
            name="status"
            defaultValue={status ?? ''}
            className="focus-visible:outline-primary-700 h-11 w-full rounded-lg border border-neutral-400 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <option value="">{adminDonationsPage.allStatuses}</option>
            {DONATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {adminStatusLabels[value]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={cn(buttonVariants(), 'h-11 px-5')}>
          {adminDonationsPage.applyFilters}
        </button>
        <Link
          href="/admin/donations"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5')}
        >
          {adminDonationsPage.clearFilters}
        </Link>
      </form>

      <section
        aria-label={adminDonationsPage.summaryLabel}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Link
          href="/admin/donations?status=succeeded"
          className="hover:border-primary-700 rounded-xl border border-neutral-300 bg-white p-4 shadow-sm transition-colors"
        >
          <span className="block text-sm text-neutral-600">
            {adminDonationsPage.confirmedTotal}
          </span>
          <strong className="text-primary-900 mt-1 block text-xl">
            {formatNpr(giving.raisedMinor)}
          </strong>
          <span className="mt-1 block text-xs text-neutral-600">
            {adminDonationsPage.giftCount(giving.gifts)}
          </span>
        </Link>
        <Link
          href="/admin/donations?status=pending"
          className="hover:border-primary-700 rounded-xl border border-neutral-300 bg-white p-4 shadow-sm transition-colors"
        >
          <span className="block text-sm text-neutral-600">{adminDonationsPage.pendingLabel}</span>
          <strong className="text-primary-900 mt-1 block text-xl">
            {giving.pendingDonations.toLocaleString('en-US')}
          </strong>
        </Link>
        <Link
          href="/admin/donations?status=failed"
          className="hover:border-primary-700 rounded-xl border border-neutral-300 bg-white p-4 shadow-sm transition-colors"
        >
          <span className="block text-sm text-neutral-600">{adminDonationsPage.failedLabel}</span>
          <strong className="text-primary-900 mt-1 block text-xl">
            {giving.failedDonations.toLocaleString('en-US')}
          </strong>
        </Link>
        <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
          <span className="block text-sm text-neutral-600">
            {adminDonationsPage.thisMonthLabel}
          </span>
          <strong className="text-primary-900 mt-1 block text-xl">
            {formatNpr(giving.thisMonthMinor)}
          </strong>
          <span className="mt-1 block text-xs text-neutral-600">
            {adminDonationsPage.giftCount(giving.thisMonthGifts)}
          </span>
        </div>
      </section>

      <p className="text-sm text-neutral-600" role="status">
        {adminDonationsPage.results(result.total)}
      </p>

      {result.items.length === 0 ? (
        <EmptyState
          title={query || status ? adminDonationsPage.noMatches : adminDonationsPage.empty}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-300 bg-white shadow-sm">
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
                  {adminDonationsPage.columns.tribute}
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
              {result.items.map((donation, index) => (
                <tr
                  key={donation.id}
                  className={cn(
                    'hover:bg-primary-100/40',
                    index % 2 === 1 ? 'bg-neutral-50' : undefined,
                  )}
                >
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
                    {donation.goalTitle ?? adminDonationsPage.generalFund}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {donation.tribute ? (
                      <span>
                        <span className="text-primary-900 block font-medium">
                          {donation.tribute.name}
                        </span>
                        <span className="block text-xs">
                          {donation.tribute.type === 'in_memory'
                            ? adminDonationsPage.tributeInMemory
                            : adminDonationsPage.tributeInHonour}
                          {donation.tribute.notifyEmail ? ' · notification address on file' : ''}
                        </span>
                      </span>
                    ) : (
                      'None'
                    )}
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
        <nav aria-label={adminDonationsPage.paginationLabel} className="flex items-center gap-3">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1, status, query)}
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
              href={pageHref(page + 1, status, query)}
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
