'use client';

import { useId, useState } from 'react';

import { adminActions, adminTicketsPage } from '@/content/admin';
import type { TicketStatus } from '@/server/services/support';

import { adminRequest } from './admin-request';
import { useAdminAction } from './use-admin-action';

const STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'closed'];

type Props = { id: string; status: TicketStatus };

/**
 * The key is the server's value: when `router.refresh()` delivers a new status, the inner
 * control remounts with that value. Until then the inner control keeps the pick it was given,
 * so the select never snaps back while the save is in flight.
 */
export function TicketStatusControl(props: Props) {
  return <TicketStatusSelect key={props.status} {...props} />;
}

function TicketStatusSelect({ id, status }: Props) {
  const selectId = useId();
  const { pending, error, run } = useAdminAction();
  const [selected, setSelected] = useState<TicketStatus>(status);

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        {adminTicketsPage.statusAction}
      </label>
      <select
        id={selectId}
        value={selected}
        disabled={pending !== null}
        onChange={(event) => {
          const next = event.target.value as TicketStatus;
          setSelected(next);
          void run('status', () =>
            adminRequest(`/api/v1/admin/tickets/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              body: { status: next },
            }),
          ).then((saved) => {
            if (!saved) setSelected(status);
          });
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
