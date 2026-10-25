'use client';

import { useId } from 'react';

import { adminActions, adminTicketsPage } from '@/content/admin';
import type { TicketStatus } from '@/server/services/support';

import { adminRequest } from './admin-request';
import { useAdminAction } from './use-admin-action';

const STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'closed'];

export function TicketStatusControl({ id, status }: { id: string; status: TicketStatus }) {
  const selectId = useId();
  const { pending, error, run } = useAdminAction();

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        {adminTicketsPage.statusAction}
      </label>
      <select
        id={selectId}
        value={status}
        disabled={pending !== null}
        onChange={(event) => {
          const next = event.target.value;
          void run('status', () =>
            adminRequest(`/api/v1/admin/tickets/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              body: { status: next },
            }),
          );
        }}
        className="text-primary-900 h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm disabled:opacity-50"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {adminTicketsPage.statusLabels[value]}
          </option>
        ))}
      </select>
      {pending ? <span className="sr-only">{adminActions.working}</span> : null}
      {error ? (
        <p role="alert" className="text-danger-600 mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
