import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAlumniPage } from '@/content/admin';
import { AlumniActions } from '@/features/admin/alumni-actions';
import { AdminPageHeader } from '@/features/admin/page-header';
import { StatusBadge } from '@/features/admin/status-badge';
import { APPROVAL_STATUSES, type ApprovalStatus } from '@/lib/constants/domain';
import { formatDate } from '@/lib/format/dates';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import { getAlumniStatusCounts, listAlumniForAdmin } from '@/server/services/alumni';

export const metadata: Metadata = { title: adminAlumniPage.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

const PAGE_SIZE = config.pagination.adminPageSize;

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

function href(params: { status?: ApprovalStatus; q?: string; page?: number }): string {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);
  if (params.page && params.page > 1) query.set('page', String(params.page));
  const suffix = query.toString();
  return suffix ? `/admin/alumni?${suffix}` : '/admin/alumni';
}

export default async function AdminAlumniPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = APPROVAL_STATUSES.includes(params.status as ApprovalStatus)
    ? (params.status as ApprovalStatus)
    : undefined;
  const q = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  await requireAdminPage();

  const [result, statusCounts] = await Promise.all([
    listAlumniForAdmin({ status, q, page, pageSize: PAGE_SIZE }),
    getAlumniStatusCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filters: { key: ApprovalStatus | undefined; label: string; count: number }[] = [
    { key: undefined, label: adminAlumniPage.statusLabels.all, count: statusCounts.all },
    ...APPROVAL_STATUSES.map((value) => ({
      key: value,
      label: adminAlumniPage.statusLabels[value],
      count: statusCounts[value],
    })),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={adminAlumniPage.title}
        description={adminAlumniPage.description}
        actions={
          <Link
            href="/admin/alumni/import"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}
          >
            {adminAlumniPage.importLink}
          </Link>
        }
      />

      <p className="-mt-3 text-sm text-neutral-600">{adminAlumniPage.importHint}</p>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const active = filter.key === status;
          return (
            <Link
              key={filter.label}
              href={href({ status: filter.key, q })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                active
                  ? 'border-primary-700 bg-primary-100 text-primary-900'
                  : 'hover:border-primary-700 hover:text-primary-900 border-neutral-300 bg-white text-neutral-600',
              )}
            >
              {filter.label}
              <span
                className={cn(
                  'text-xs font-semibold',
                  active ? 'text-primary-700' : 'text-neutral-500',
                )}
              >
                {filter.count.toLocaleString('en-US')}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <form action="/admin/alumni" method="get" className="flex flex-wrap gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="alumni-search" className="sr-only">
            {adminAlumniPage.searchLabel}
          </label>
          <Input
            id="alumni-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={adminAlumniPage.searchLabel}
            className="h-10 bg-white sm:w-80"
          />
          <button type="submit" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}>
            {adminAlumniPage.search}
          </button>
        </form>
        <p className="text-sm text-neutral-600" role="status">
          {adminAlumniPage.results(result.total)}
        </p>
      </div>

      {result.items.length === 0 ? (
        <EmptyState title={adminAlumniPage.empty} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-300 bg-white shadow-sm">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">{adminAlumniPage.title}</caption>
            <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminAlumniPage.columns.person}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminAlumniPage.columns.programme}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminAlumniPage.columns.place}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminAlumniPage.columns.submitted}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminAlumniPage.columns.status}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminAlumniPage.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {result.items.map((person) => (
                <tr key={person.id} className="align-top hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="text-primary-900 font-medium">{person.fullName}</p>
                    <p className="text-neutral-600">{person.email}</p>
                    {person.phone ? <p className="text-neutral-600">{person.phone}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {person.programme}
                    <span className="block text-xs">{person.batchYear}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {person.city ? `${person.city}, ` : ''}
                    {person.country}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(person.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={person.status} />
                  </td>
                  <td className="px-4 py-3">
                    <AlumniActions id={person.id} status={person.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label={adminAlumniPage.paginationLabel} className="flex items-center gap-3">
          {page > 1 ? (
            <Link
              href={href({ status, q, page: page - 1 })}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
            >
              {adminAlumniPage.previous}
            </Link>
          ) : null}
          <span className="text-sm text-neutral-600">
            {adminAlumniPage.pageOf(page, totalPages)}
          </span>
          {page < totalPages ? (
            <Link
              href={href({ status, q, page: page + 1 })}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
            >
              {adminAlumniPage.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
