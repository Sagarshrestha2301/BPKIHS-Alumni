'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { adminActions, adminPostsPage } from '@/content/admin';

import { adminRequest } from './admin-request';
import { ReasonForm } from './reason-form';
import { useAdminAction } from './use-admin-action';

export function PostActions({ id }: { id: string }) {
  const { pending, error, run } = useAdminAction();
  const [rejecting, setRejecting] = useState(false);
  const base = `/api/v1/admin/posts/${encodeURIComponent(id)}`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending !== null}
          onClick={() => run('approve', () => adminRequest(`${base}/approve`, { method: 'POST' }))}
        >
          {pending === 'approve' ? adminActions.working : adminPostsPage.approve}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending !== null}
          onClick={() => setRejecting(true)}
        >
          {adminPostsPage.reject}
        </Button>
      </div>

      {rejecting ? (
        <ReasonForm
          title={adminPostsPage.rejectTitle}
          hint={adminPostsPage.rejectHint}
          label={adminPostsPage.reasonLabel}
          submitLabel={adminPostsPage.rejectSubmit}
          cancelLabel={adminPostsPage.cancel}
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
