'use client';

import { Button } from '@/components/ui/button';
import { adminActions, adminReportsPage } from '@/content/admin';

import { adminRequest } from './admin-request';
import { useAdminAction } from './use-admin-action';

export function ReportActions({ id }: { id: string }) {
  const { pending, error, run } = useAdminAction();
  const base = `/api/v1/admin/reports/${encodeURIComponent(id)}/resolve`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending !== null}
          onClick={() =>
            run('reviewed', () =>
              adminRequest(base, { method: 'POST', body: { action: 'reviewed' } }),
            )
          }
        >
          {pending === 'reviewed' ? adminActions.working : adminReportsPage.review}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() =>
            run('dismissed', () =>
              adminRequest(base, { method: 'POST', body: { action: 'dismissed' } }),
            )
          }
        >
          {pending === 'dismissed' ? adminActions.working : adminReportsPage.dismiss}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-danger-600 mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
