import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNewsletterPage as copy } from '@/content/admin-content';
import { NewsletterComposer } from '@/features/admin/newsletter-composer';
import { AdminPageHeader } from '@/features/admin/page-header';
import { formatDateTime } from '@/lib/format/dates';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import {
  listCampaigns,
  listSubscribersForAdmin,
  subscriberTotals,
} from '@/server/services/newsletter';

export const metadata: Metadata = { title: copy.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

const PAGE_SIZE = config.pagination.adminPageSize;

type SearchParams = Promise<{ page?: string; q?: string; status?: string }>;

function href(params: { page?: number; q?: string; status?: string }): string {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set('page', String(params.page));
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status', params.status);
  const suffix = query.toString();
  return suffix ? `/admin/newsletter?${suffix}` : '/admin/newsletter';
}

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() || undefined;
  const status =
    params.status === 'subscribed' ||
    params.status === 'unsubscribed' ||
    params.status === 'pending'
      ? params.status
      : undefined;

  await requireAdminPage();

  const [subscribers, campaigns, totals] = await Promise.all([
    listSubscribersForAdmin({ page, pageSize: PAGE_SIZE, q, status }),
    listCampaigns(),
    subscriberTotals(),
  ]);
  const totalPages = Math.max(1, Math.ceil(subscribers.total / subscribers.pageSize));

  return (
    <div className="space-y-10">
      <AdminPageHeader title={copy.title} description={copy.description} />

      <NewsletterComposer subscribed={totals.subscribed} total={totals.total} />

      <section aria-labelledby="campaigns-heading">
        <h2 id="campaigns-heading" className="font-heading text-primary-900 text-xl font-semibold">
          {copy.campaignsTitle}
        </h2>
        {campaigns.length === 0 ? (
          <EmptyState className="mt-4" title={copy.campaignsEmpty} />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-300 bg-white">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <caption className="sr-only">{copy.campaignsTitle}</caption>
              <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.subject}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.recipients}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.sent}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.failed}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.status}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.date}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-neutral-50">
                    <td className="text-primary-900 px-4 py-3 font-medium">{campaign.subject}</td>
                    <td className="px-4 py-3 text-neutral-600">{campaign.recipientCount}</td>
                    <td className="px-4 py-3 text-neutral-600">{campaign.sentCount}</td>
                    <td className="px-4 py-3 text-neutral-600">{campaign.failedCount}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {copy.statusLabels[campaign.status] ?? campaign.status}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDateTime(campaign.sentAt ?? campaign.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="subscribers-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="subscribers-heading"
            className="font-heading text-primary-900 text-xl font-semibold"
          >
            {copy.subscribersTitle}
          </h2>
          <p className="text-sm text-neutral-600">
            {copy.subscribersCount(totals.subscribed, totals.total)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {([undefined, 'subscribed', 'pending', 'unsubscribed'] as const).map((value) => {
            const active = value === status;
            const label = value ? copy.statusLabels[value] : copy.statusLabels.all;
            const count = value ? totals[value] : totals.total;
            return (
              <Link
                key={label}
                href={href({ q, status: value })}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary-700 bg-primary-100 text-primary-900'
                    : 'hover:border-primary-700 hover:text-primary-900 border-neutral-300 bg-white text-neutral-600',
                )}
              >
                {label}
                <span
                  className={cn(
                    'text-xs font-semibold',
                    active ? 'text-primary-700' : 'text-neutral-500',
                  )}
                >
                  {count.toLocaleString('en-US')}
                </span>
              </Link>
            );
          })}
        </div>

        <form action="/admin/newsletter" method="get" className="mt-3 flex flex-wrap gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="subscriber-search" className="sr-only">
            {copy.searchLabel}
          </label>
          <Input
            id="subscriber-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={copy.searchLabel}
            className="h-10 bg-white sm:max-w-sm"
          />
          <button type="submit" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}>
            {copy.search}
          </button>
        </form>

        {subscribers.items.length === 0 ? (
          <EmptyState className="mt-4" title={copy.subscribersEmpty} />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-300 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">{copy.subscribersTitle}</caption>
              <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.email}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.status}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.interests}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {copy.columns.joined}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {subscribers.items.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-neutral-50">
                    <td className="text-primary-900 px-4 py-3">{subscriber.email}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {copy.statusLabels[subscriber.status] ?? subscriber.status}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {subscriber.interests.join(', ') || 'None'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDateTime(subscriber.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <nav aria-label="Subscriber pages" className="mt-4 flex items-center gap-3">
            {page > 1 ? (
              <Link
                href={href({ page: page - 1, q, status })}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
              >
                {copy.previous}
              </Link>
            ) : null}
            <span className="text-sm text-neutral-600">{copy.pageOf(page, totalPages)}</span>
            {page < totalPages ? (
              <Link
                href={href({ page: page + 1, q, status })}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
              >
                {copy.next}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
