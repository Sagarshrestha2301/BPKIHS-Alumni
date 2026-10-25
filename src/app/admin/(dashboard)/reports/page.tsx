import type { Metadata } from 'next';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { adminReportsPage } from '@/content/admin';
import { ReportActions } from '@/features/admin/report-actions';
import { formatDate } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { listOpenReports } from '@/server/services/community';

export const metadata: Metadata = { title: adminReportsPage.title };

export default async function AdminReportsPage() {
  await requireAdminPage();

  const reports = await listOpenReports();

  return (
    <div>
      <h1 className="font-heading text-primary-900 text-3xl font-semibold">
        {adminReportsPage.title}
      </h1>
      <p className="mt-2 text-neutral-600">{adminReportsPage.description}</p>

      {reports.length === 0 ? (
        <EmptyState className="mt-6" title={adminReportsPage.empty} />
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((report) => (
            <li key={report.id} className="rounded-xl border border-neutral-300 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Badge
                    variant="outline"
                    className="border-accent-600/30 bg-accent-100 text-accent-700"
                  >
                    {report.reason}
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
