import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { accountPage } from '@/content/account';
import { AccountActions } from '@/features/auth/account-actions';
import { getSession } from '@/server/auth/session';
import { findRegistrationForUser } from '@/server/services/registration';

export const metadata: Metadata = {
  title: accountPage.title,
  description: accountPage.description,
  alternates: { canonical: '/account' },
  robots: { index: false, follow: false },
};

const STATUS_VARIANT = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
} as const;

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await findRegistrationForUser(session.user.id);
  const rows: { label: string; value: string | undefined }[] = profile
    ? [
        { label: accountPage.fields.fullName, value: profile.fullName },
        { label: accountPage.fields.programme, value: profile.programme },
        { label: accountPage.fields.batchYear, value: String(profile.batchYear) },
        { label: accountPage.fields.country, value: profile.country },
        { label: accountPage.fields.city, value: profile.city },
        { label: accountPage.fields.currentPosition, value: profile.currentPosition },
        { label: accountPage.fields.organisation, value: profile.organisation },
        { label: accountPage.fields.furtherStudies, value: profile.furtherStudies },
        { label: accountPage.fields.note, value: profile.note },
        {
          label: accountPage.fields.privacy,
          value: accountPage.privacyLabels[profile.privacy.profile],
        },
      ]
    : [];
  const visibleRows = rows.filter((row): row is { label: string; value: string } =>
    Boolean(row.value),
  );

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-primary-900 text-3xl font-semibold">
          {accountPage.title}
        </h1>
        <p className="mt-2 text-neutral-600">{accountPage.description}</p>

        <div className="mt-8 rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-600">{accountPage.emailLabel}</p>
              <p className="font-medium text-neutral-900">{session.user.email}</p>
            </div>
            <Badge variant={session.user.emailVerified ? 'default' : 'outline'}>
              {session.user.emailVerified
                ? accountPage.verification.verified
                : accountPage.verification.unverified}
            </Badge>
          </div>

          {profile ? (
            <div className="mt-6 border-t border-neutral-300 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-neutral-600">{accountPage.statusLabel}</p>
                <Badge variant={STATUS_VARIANT[profile.status]}>
                  {accountPage.status[profile.status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {accountPage.statusHelp[profile.status]}
              </p>
            </div>
          ) : (
            <div className="mt-6 border-t border-neutral-300 pt-6">
              <p className="text-sm text-neutral-600">{accountPage.noProfile}</p>
              <Link
                href="/register"
                className="text-primary-700 mt-2 inline-block text-sm underline underline-offset-4"
              >
                {accountPage.register}
              </Link>
            </div>
          )}

          {visibleRows.length > 0 ? (
            <dl className="mt-6 grid gap-4 border-t border-neutral-300 pt-6 sm:grid-cols-2">
              {visibleRows.map((row) => (
                <div key={row.label}>
                  <dt className="text-sm text-neutral-600">{row.label}</dt>
                  <dd className="text-neutral-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {profile ? <p className="mt-6 text-sm text-neutral-600">{accountPage.editHelp}</p> : null}
        </div>

        <div className="mt-8">
          <AccountActions email={session.user.email} verified={session.user.emailVerified} />
        </div>

        <p className="mt-8 text-sm">
          <Link href="/directory" className="text-primary-700 underline underline-offset-4">
            {accountPage.directory}
          </Link>
        </p>
      </div>
    </Container>
  );
}
