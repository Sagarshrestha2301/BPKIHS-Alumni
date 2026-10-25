import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAlumniPage } from '@/content/admin';
import { AlumniActions } from '@/features/admin/alumni-actions';
import { StatusBadge } from '@/features/admin/status-badge';
import { APPROVAL_STATUSES, type ApprovalStatus } from '@/lib/constants/domain';
import { formatDate } from '@/lib/format/dates';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import { listAlumniForAdmin } from '@/server/services/alumni';

export const metadata: Metadata = { title: adminAlumniPage.title };

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

  const result = await listAlumniForAdmin({ status, q, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filters: { key: ApprovalStatus | undefined; label: string }[] = [
    { key: undefined, label: adminAlumniPage.statusLabels.all },
    ...APPROVAL_STATUSES.map((value) => ({
      key: value,
      label: adminAlumniPage.statusLabels[value],
    })),
  ];

  return (
    <div>
      <h1 className="font-heading text-primary-900 text-3xl font-semibold">
        {adminAlumniPage.title}
      </h1>
      <p className="mt-2 text-neutral-600">{adminAlumniPage.description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const active = filter.key === status;
          return (
            <Link
              key={filter.label}
              href={href({ status: filter.key, q })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium',
                active
                  ? 'border-primary-700 bg-primary-100 text-primary-900'
                  : 'hover:text-primary-900 border-neutral-300 bg-white text-neutral-600',
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <form action="/admin/alumni" method="get" className="mt-4 flex flex-wrap gap-2">
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
          className="h-10 bg-white sm:max-w-sm"
        />
        <button type="submit" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4')}>
          Search
        </button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState className="mt-6" title={adminAlumniPage.empty} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-300 bg-white">
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
                <tr key={person.id} className="align-top">
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
        <nav aria-label="Registrations pages" className="mt-6 flex items-center gap-3">
          {page > 1 ? (
            <Link
              href={href({ status, q, page: page - 1 })}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
            >
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-neutral-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={href({ status, q, page: page + 1 })}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
