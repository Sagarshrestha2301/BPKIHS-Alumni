import type { Metadata } from 'next';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { adminReportsPage } from '@/content/admin';
import { AdminPageHeader } from '@/features/admin/page-header';
import { ReportActions } from '@/features/admin/report-actions';
import { formatDate } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { listOpenReports } from '@/server/services/community';

export const metadata: Metadata = { title: adminReportsPage.title };

/** The session guard reads per-request data, so this page blocks instead of prerendering. */
export const instant = false;

export default async function AdminReportsPage() {
  await requireAdminPage();

  const reports = await listOpenReports();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={adminReportsPage.title}
        description={adminReportsPage.description}
        actions={
          <span className="text-sm text-neutral-600">
            {adminReportsPage.openCount(reports.length)}
          </span>
        }
      />

      {reports.length === 0 ? (
        <EmptyState title={adminReportsPage.empty} />
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-xl border border-neutral-300 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge
                    variant="outline"
                    className="border-accent-600/30 bg-accent-100 text-accent-700"
                  >
                    {adminReportsPage.reasonLabels[report.reason] ?? report.reason}
                  </Badge>
                  <h2 className="font-heading text-primary-900 mt-2 text-lg font-semibold">
                    {report.postTitle}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {adminReportsPage.columns.reported}: {formatDate(report.createdAt)}
                  </p>
                </div>
                <ReportActions id={report.id} />
              </div>
              {report.details ? (
                <p className="mt-3 text-sm whitespace-pre-line text-neutral-600">
                  {report.details}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
