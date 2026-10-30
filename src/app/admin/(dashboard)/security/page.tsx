import { KeyRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { adminSecurity } from '@/content/admin';
import { AdminPageHeader } from '@/features/admin/page-header';
import { SecurityPanel } from '@/features/admin/security-panel';
import { requireAdminPage } from '@/server/auth/admin-page';
import { adminTwoFactorPending } from '@/server/auth/two-factor-status';

export const metadata: Metadata = {
  title: adminSecurity.title,
  robots: { index: false, follow: false },
};

/** The session decides whether 2FA is on, so the page cannot be prerendered. */
export const instant = false;

export default async function AdminSecurityPage() {
  // The one admin page that stays reachable while enrolment is pending; every other page
  // redirects here instead.
  const session = await requireAdminPage({ allowEnrolment: true });
  const twoFactorRequired = await adminTwoFactorPending(session.user);

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader title={adminSecurity.title} description={adminSecurity.description} />

      {twoFactorRequired ? (
        <div
          role="status"
          className="border-primary-700/30 bg-primary-100/60 rounded-xl border p-5"
        >
          <p className="text-primary-900 font-semibold">{adminSecurity.requiredTitle}</p>
          <p className="mt-1 text-sm text-neutral-700">{adminSecurity.requiredHelp}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="security-account"
          className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm"
        >
          <h2 id="security-account" className="font-heading text-primary-900 text-lg font-semibold">
            {adminSecurity.accountTitle}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{adminSecurity.accountHint}</p>

          <dl className="mt-5 grid gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium tracking-wide text-neutral-600 uppercase">
                {adminSecurity.emailLabel}
              </dt>
              <dd className="text-primary-900 mt-0.5 font-medium break-all">
                {session.user.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-neutral-600 uppercase">
                {adminSecurity.roleLabel}
              </dt>
              <dd className="text-primary-900 mt-0.5 font-medium">{adminSecurity.roleAdmin}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-neutral-300 pt-5">
            <p className="text-primary-900 text-sm font-medium">{adminSecurity.passwordTitle}</p>
            <p className="mt-1 text-sm text-neutral-600">{adminSecurity.passwordHint}</p>
            <Link
              href="/account"
              className="text-primary-700 mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
            >
              <KeyRound aria-hidden="true" className="size-4" />
              {adminSecurity.changePassword}
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="security-two-factor"
          className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm"
        >
          <h2
            id="security-two-factor"
            className="font-heading text-primary-900 text-lg font-semibold"
          >
            {adminSecurity.statusLabel}
          </h2>
          <div className="mt-5">
            {session.user.twoFactorEnabled === true ? (
              <p className="text-sm text-neutral-600">
                Two-factor is enabled. You will be asked for a code the next time you sign in.
              </p>
            ) : (
              <SecurityPanel enabled={false} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
