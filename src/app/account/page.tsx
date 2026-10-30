import { BadgeCheck, Eye, Pencil, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { accountPage } from '@/content/account';
import { PasswordForm } from '@/features/account/password-form';
import { SignOutButton } from '@/features/account/sign-out-button';
import { VerificationCard } from '@/features/auth/verification-card';
import { cn } from '@/lib/utils';
import { getSession } from '@/server/auth/session';
import { findRegistrationForUser } from '@/server/services/registration';

export const metadata: Metadata = {
  title: accountPage.title,
  description: accountPage.description,
  alternates: { canonical: '/account' },
  robots: { index: false, follow: false },
};

/**
 * Session and profile data are per-request by definition, so this route cannot be prerendered
 * into a static shell. `instant = false` tells Cache Components to block on the server instead
 * of flagging the reads: the alternative (a skeleton followed by a redirect) is worse for a
 * page whose only job is to show the signed-in member their own record.
 */
export const instant = false;

const STATUS_VARIANT = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
} as const;

/** The surface every block on this page is built from. */
const CARD = 'rounded-xl border border-neutral-300 bg-white shadow-sm';
const CARD_LABEL = 'flex items-center gap-3';
const CARD_ICON =
  'bg-primary-100 text-primary-700 flex size-9 shrink-0 items-center justify-center rounded-lg';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await findRegistrationForUser(session.user.id);
  const roleKey =
    session.user.role === 'admin' ? 'admin' : session.user.role === 'alumni' ? 'alumni' : 'donor';
  const displayName = profile?.fullName ?? session.user.name ?? '';
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
        {
          label: accountPage.fields.expertise,
          value: profile.expertise?.join(', '),
        },
        { label: accountPage.fields.note, value: profile.note },
      ]
    : [];
  const visibleRows = rows.filter((row): row is { label: string; value: string } =>
    Boolean(row.value),
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: accountPage.title }]}
        title={accountPage.title}
        description={accountPage.description}
      />

      <Section>
        <div className="grid gap-6">
          {/* Who is signed in, and the two things they do most: edit and leave. */}
          <div className={cn(CARD, 'min-w-0 p-6 lg:p-8')}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {profile?.photoUrl ? (
                  <Image
                    src={profile.photoUrl}
                    alt=""
                    width={80}
                    height={80}
                    unoptimized
                    className="size-20 shrink-0 rounded-full border border-neutral-300 object-cover"
                  />
                ) : displayName ? (
                  <InitialsAvatar name={displayName} size="lg" />
                ) : null}
                <div className="min-w-0">
                  {displayName ? (
                    <p className="font-heading text-primary-900 text-xl font-semibold lg:text-2xl">
                      {displayName}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      'flex flex-wrap items-center gap-x-3 gap-y-1.5',
                      displayName && 'mt-2',
                    )}
                  >
                    <p className="min-w-0 text-sm break-words text-neutral-600">
                      {session.user.email}
                    </p>
                    <Badge variant={session.user.emailVerified ? 'default' : 'outline'}>
                      {session.user.emailVerified
                        ? accountPage.verification.verified
                        : accountPage.verification.unverified}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {profile ? (
                  <Link
                    href="/account/profile"
                    className={cn(buttonVariants(), 'h-11 gap-2 px-5 text-base')}
                  >
                    <Pencil aria-hidden="true" />
                    {accountPage.editProfile}
                  </Link>
                ) : null}
                <SignOutButton />
              </div>
            </div>
          </div>

          {/* Renders nothing once the address is confirmed. */}
          <VerificationCard email={session.user.email} verified={session.user.emailVerified} />

          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className={cn(CARD, 'min-w-0 p-5')}>
              <p className={CARD_LABEL}>
                <span aria-hidden="true" className={CARD_ICON}>
                  <UserRound className="size-5" />
                </span>
                <span className="text-sm font-medium text-neutral-600">
                  {accountPage.roleLabel}
                </span>
              </p>
              <p className="font-heading text-primary-900 mt-4 text-xl font-semibold">
                {accountPage.roles[roleKey]}
              </p>
              <p className="mt-1.5 text-sm text-neutral-600">{accountPage.roleHelp[roleKey]}</p>
              {roleKey === 'admin' ? (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 h-10 px-4 text-sm')}
                >
                  {accountPage.adminLink}
                </Link>
              ) : null}
            </div>

            {profile ? (
              <div className={cn(CARD, 'min-w-0 p-5')}>
                <p className={CARD_LABEL}>
                  <span aria-hidden="true" className={CARD_ICON}>
                    <BadgeCheck className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-neutral-600">
                    {accountPage.statusLabel}
                  </span>
                </p>
                <div className="mt-4">
                  <Badge variant={STATUS_VARIANT[profile.status]} className="h-7 px-3 text-sm">
                    {accountPage.status[profile.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  {accountPage.statusHelp[profile.status]}
                </p>
                {profile.status === 'rejected' ? (
                  <div className="border-danger-600/30 bg-danger-600/5 mt-3 rounded-lg border p-3">
                    <p className="text-sm font-medium text-neutral-900">
                      {accountPage.rejectionReasonLabel}
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">
                      {profile.rejectionReason ?? accountPage.rejectionReasonMissing}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {profile ? (
              <div className={cn(CARD, 'min-w-0 p-5')}>
                <p className={CARD_LABEL}>
                  <span aria-hidden="true" className={CARD_ICON}>
                    <Eye className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-neutral-600">
                    {accountPage.fields.privacy}
                  </span>
                </p>
                <p className="font-heading text-primary-900 mt-4 text-xl font-semibold">
                  {accountPage.privacyLabels[profile.privacy.profile]}
                </p>
                <p className="mt-1.5 text-sm text-neutral-600">{accountPage.visibilityHelp}</p>
                <Link
                  href="/directory"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 h-10 px-4 text-sm')}
                >
                  {accountPage.directory}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <section aria-labelledby="profile-heading" className={cn(CARD, 'min-w-0 p-6')}>
              <h2
                id="profile-heading"
                className="font-heading text-primary-900 text-xl font-semibold"
              >
                {accountPage.profileTitle}
              </h2>
              {profile ? (
                <>
                  <p className="mt-2 text-sm text-neutral-600">{accountPage.editHelp}</p>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    {visibleRows.map((row) => (
                      <div key={row.label} className="min-w-0">
                        <dt className="text-sm text-neutral-600">{row.label}</dt>
                        <dd className="break-words text-neutral-900">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-neutral-600">{accountPage.noProfile}</p>
                  {roleKey !== 'admin' ? (
                    <Link
                      href="/register"
                      className="text-primary-700 mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
                    >
                      {accountPage.register}
                    </Link>
                  ) : null}
                </div>
              )}
            </section>

            <section aria-labelledby="password-heading" className={cn(CARD, 'min-w-0 p-6')}>
              <h2
                id="password-heading"
                className="font-heading text-primary-900 text-xl font-semibold"
              >
                {accountPage.password.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-600">{accountPage.password.description}</p>
              <div className="mt-5">
                <PasswordForm />
              </div>
            </section>
          </div>
        </div>
      </Section>
    </>
  );
}
