'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { adminActions, adminAlumniPage } from '@/content/admin';
import type { ApprovalStatus } from '@/lib/constants/domain';

import { adminRequest } from './admin-request';
import { ReasonForm } from './reason-form';
import { useAdminAction } from './use-admin-action';

export function AlumniActions({ id, status }: { id: string; status: ApprovalStatus }) {
  const { pending, error, run } = useAdminAction();
  const [rejecting, setRejecting] = useState(false);
  const base = `/api/v1/admin/alumni/${encodeURIComponent(id)}`;

  if (status === 'approved') {
    return <span className="text-sm text-neutral-600">{adminAlumniPage.approvedNote}</span>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending !== null}
          onClick={() => run('approve', () => adminRequest(`${base}/approve`, { method: 'POST' }))}
        >
          {pending === 'approve' ? adminActions.working : adminAlumniPage.approve}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() => setRejecting(true)}
        >
          {adminAlumniPage.reject}
        </Button>
      </div>

      {rejecting ? (
        <ReasonForm
          title={adminAlumniPage.rejectTitle}
          hint={adminAlumniPage.rejectHint}
          label={adminAlumniPage.reasonLabel}
          submitLabel={adminAlumniPage.rejectSubmit}
          cancelLabel={adminAlumniPage.cancel}
          busy={pending === 'reject'}
          onCancel={() => setRejecting(false)}
          onSubmit={(reason) =>
            run('reject', async () => {
              await adminRequest(`${base}/reject`, { method: 'POST', body: { reason } });
              setRejecting(false);
            })
          }
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-danger-600 mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
