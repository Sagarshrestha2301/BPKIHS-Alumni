import { desc } from 'drizzle-orm';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/shared/empty-state';
import { adminAuditPage as copy } from '@/content/admin-content';
import { formatDateTime } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import { db } from '@/server/db/client';
import { adminAuditLog } from '@/server/db/schema';

export const metadata: Metadata = { title: copy.title };

export default async function AdminAuditPage() {
  await requireAdminPage();

  const rows = await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(config.pagination.auditLimit);

  return (
    <div>
      <h1 className="font-heading text-primary-900 text-3xl font-semibold">{copy.title}</h1>
      <p className="mt-2 text-neutral-600">{copy.description}</p>

      {rows.length === 0 ? (
        <EmptyState className="mt-6" title={copy.empty} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-300 bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">{copy.title}</caption>
            <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.when}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.action}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.entity}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.entityId}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.detail}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(row.createdAt.toISOString())}
                  </td>
                  <td className="text-primary-900 px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3 text-neutral-600">{row.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                    {row.entityId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {row.detail ? JSON.stringify(row.detail) : '—'}
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
