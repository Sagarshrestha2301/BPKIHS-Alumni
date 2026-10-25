import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { adminTicketsPage } from '@/content/admin';
import { TicketStatusControl } from '@/features/admin/ticket-status';
import { formatDate } from '@/lib/format/dates';
import { cn } from '@/lib/utils';
import { requireAdminPage } from '@/server/auth/admin-page';
import { listTicketsForAdmin, type TicketStatus } from '@/server/services/support';

export const metadata: Metadata = { title: adminTicketsPage.title };

const STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'closed'];

type SearchParams = Promise<{ status?: string }>;

export default async function AdminTicketsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = STATUSES.includes(params.status as TicketStatus)
    ? (params.status as TicketStatus)
    : undefined;
  await requireAdminPage();

  const tickets = await listTicketsForAdmin(status);

  return (
    <div>
      <h1 className="font-heading text-primary-900 text-3xl font-semibold">
        {adminTicketsPage.title}
      </h1>
      <p className="mt-2 text-neutral-600">{adminTicketsPage.description}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[undefined, ...STATUSES].map((value) => {
          const active = value === status;
          const label = value ? adminTicketsPage.statusLabels[value] : 'All';
          return (
            <Link
              key={label}
              href={value ? `/admin/tickets?status=${value}` : '/admin/tickets'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium',
                active
                  ? 'border-primary-700 bg-primary-100 text-primary-900'
                  : 'hover:text-primary-900 border-neutral-300 bg-white text-neutral-600',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <EmptyState className="mt-6" title={adminTicketsPage.empty} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-300 bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">{adminTicketsPage.title}</caption>
            <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminTicketsPage.columns.reference}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminTicketsPage.columns.person}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminTicketsPage.columns.subject}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminTicketsPage.columns.received}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {adminTicketsPage.columns.status}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="align-top">
                  <td className="text-primary-900 px-4 py-3 font-mono text-xs">
                    {ticket.reference}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-primary-900 font-medium">{ticket.name}</p>
                    <p className="text-neutral-600">{ticket.email}</p>
                    <p className="text-xs text-neutral-600">{ticket.topic}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-primary-900 font-medium">{ticket.subject}</p>
                    <details className="mt-1">
                      <summary className="text-primary-700 cursor-pointer text-xs underline underline-offset-4">
                        {adminTicketsPage.readMessage}
                      </summary>
                      <p className="mt-2 max-w-md text-sm whitespace-pre-line text-neutral-600">
                        {ticket.message}
                      </p>
                    </details>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(ticket.createdAt)}</td>
                  <td className="px-4 py-3">
                    <TicketStatusControl id={ticket.id} status={ticket.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
