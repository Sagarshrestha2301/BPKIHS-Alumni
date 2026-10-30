import type { Metadata } from 'next';

import { adminPaymentsPage as copy } from '@/content/admin';
import { AdminPageHeader } from '@/features/admin/page-header';
import { formatDateTime } from '@/lib/format/dates';
import { requireAdminPage } from '@/server/auth/admin-page';
import { gatewayOverview } from '@/server/payments/status';
import { listGatewayChecks } from '@/server/services/gateway-checks';

export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false, follow: false },
};

/** Credentials and the last check are runtime data, so this page must not be prerendered. */
export const instant = false;

function StatePill({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={
        on
          ? 'bg-primary-100 text-primary-900 inline-flex rounded-full px-2.5 py-1 text-xs font-medium'
          : 'inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700'
      }
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export default async function AdminPaymentsPage() {
  await requireAdminPage();

  const overview = gatewayOverview();
  const checks = new Map((await listGatewayChecks()).map((check) => [check.gateway, check]));

  return (
    <div className="space-y-6">
      <AdminPageHeader title={copy.title} description={copy.description} />

      <div
        className={
          overview.mode
            ? 'rounded-xl border border-neutral-300 bg-white p-5 shadow-sm'
            : 'border-danger-600/30 bg-danger-600/5 rounded-xl border p-5'
        }
      >
        <p className="font-medium text-neutral-900">
          {copy.modeLabel}:{' '}
          <span className="font-semibold">{overview.mode ?? copy.modeNotSet}</span>
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          {overview.mode === 'live'
            ? copy.liveNotice
            : overview.mode === 'sandbox'
              ? copy.sandboxNotice
              : copy.modeUnset}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-300 bg-white shadow-sm">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <caption className="sr-only">{copy.tableCaption}</caption>
          <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
            <tr>
              {[
                copy.columns.gateway,
                copy.columns.adapter,
                copy.columns.credentials,
                copy.columns.checkout,
                copy.columns.missing,
                copy.columns.lastCheck,
              ].map((heading) => (
                <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {overview.gateways.map((gateway) => {
              const check = checks.get(gateway.id);
              return (
                <tr key={gateway.id} className="align-top hover:bg-neutral-50">
                  <th scope="row" className="text-primary-900 px-4 py-4 font-medium">
                    {gateway.label}
                  </th>
                  <td className="px-4 py-4 text-neutral-600">
                    {gateway.hasAdapter ? copy.adapterPresent : copy.adapterMissing}
                  </td>
                  <td className="px-4 py-4">
                    {gateway.hasAdapter ? (
                      <StatePill
                        on={gateway.configured}
                        onLabel={copy.configured}
                        offLabel={copy.notConfigured}
                      />
                    ) : (
                      <span className="text-neutral-600">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {gateway.hasAdapter ? (
                      <StatePill
                        on={gateway.offered}
                        onLabel={copy.offered}
                        offLabel={copy.hidden}
                      />
                    ) : (
                      <span className="text-neutral-600">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {!gateway.hasAdapter ? (
                      <span className="text-neutral-600">{copy.noAdapterNote}</span>
                    ) : gateway.missing.length === 0 ? (
                      <span className="text-neutral-600">{copy.noMissing}</span>
                    ) : (
                      <ul className="space-y-1">
                        {gateway.missing.map((name) => (
                          <li key={name}>
                            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-900">
                              {name}
                            </code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {check ? (
                      <div className="max-w-sm">
                        <p className="font-medium text-neutral-900">
                          {copy.checkStatus[check.status] ?? check.status}{' '}
                          <span className="font-normal text-neutral-600">({check.mode})</span>
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-600">
                          {formatDateTime(check.checkedAt)}
                        </p>
                        <p className="mt-1 text-xs break-words text-neutral-600">{check.detail}</p>
                      </div>
                    ) : (
                      <span className="text-neutral-600">{copy.noCheck}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="payments-run" className="max-w-3xl">
        <h2 id="payments-run" className="font-heading text-primary-900 text-xl font-semibold">
          {copy.runTitle}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{copy.runHelp}</p>
        <div className="mt-3 space-y-2 rounded-xl border border-neutral-300 bg-white p-4">
          <p>
            <code className="font-mono text-sm text-neutral-900">{copy.runCommand}</code>
          </p>
          <p className="text-sm text-neutral-600">
            {copy.dryRunLabel}{' '}
            <code className="font-mono text-neutral-900">{copy.dryRunCommand}</code>
          </p>
        </div>
        <p className="mt-3 text-sm text-neutral-600">{copy.donationNote}</p>
      </section>
    </div>
  );
}
