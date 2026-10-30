import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/shared/empty-state';
import { adminAuditPage as copy } from '@/content/admin-content';
import { AdminPageHeader } from '@/features/admin/page-header';
import { formatDateTime } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { config } from '@/server/config';
import { db } from '@/server/db/client';
import { adminAuditLog, user } from '@/server/db/schema';

export const metadata: Metadata = { title: copy.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

function Detail({ value }: { value: Record<string, unknown> | null }) {
  if (!value) return <span className="text-neutral-600">{copy.detailEmpty}</span>;
  const entries = Object.entries(value);
  if (entries.length === 0) return <span className="text-neutral-600">{copy.detailEmpty}</span>;

  return (
    <dl className="grid gap-0.5 text-xs">
      {entries.slice(0, 8).map(([key, entry]) => (
        <div key={key} className="flex flex-wrap gap-x-1.5">
          <dt className="font-medium text-neutral-700">{key.replaceAll('_', ' ')}</dt>
          <dd className="break-words text-neutral-600">
            {typeof entry === 'string' || typeof entry === 'number'
              ? String(entry)
              : JSON.stringify(entry)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AdminAuditPage() {
  await requireAdminPage();

  const rows = await db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      entity: adminAuditLog.entity,
      entityId: adminAuditLog.entityId,
      detail: adminAuditLog.detail,
      createdAt: adminAuditLog.createdAt,
      actorName: user.name,
      actorEmail: user.email,
    })
    .from(adminAuditLog)
    .leftJoin(user, eq(adminAuditLog.actorId, user.id))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(config.pagination.auditLimit);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <span className="text-sm text-neutral-600">
            {copy.limitNote(config.pagination.auditLimit)}
          </span>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title={copy.empty} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-300 bg-white shadow-sm">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <caption className="sr-only">{copy.title}</caption>
            <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.when}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.actor}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.action}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.entity}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {copy.columns.detail}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-neutral-50">
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                    {formatDateTime(row.createdAt.toISOString())}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-primary-900 font-medium">
                      {row.actorName ?? row.actorEmail ?? copy.actorUnknown}
                    </p>
                    {row.actorName && row.actorEmail ? (
                      <p className="text-xs text-neutral-600">{row.actorEmail}</p>
                    ) : null}
                  </td>
                  <td className="text-primary-900 px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {row.entity}
                    {row.entityId ? (
                      <span className="block font-mono text-xs break-all">{row.entityId}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <Detail value={row.detail} />
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
