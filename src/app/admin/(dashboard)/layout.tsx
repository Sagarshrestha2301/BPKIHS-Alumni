import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Container } from '@/components/layout/container';
import { adminShell } from '@/content/admin';
import { AdminMenu } from '@/features/admin/admin-menu';
import { AdminNav } from '@/features/admin/admin-nav';
import { SignOutButton } from '@/features/admin/sign-out-button';
import { getSession } from '@/server/auth/session';
import { adminTwoFactorPending } from '@/server/auth/two-factor-status';
import { getAdminCounts } from '@/server/services/content';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/** Every admin screen needs the session before it can render, so the segment blocks. */
export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/sign-in');

  if (session.user.role !== 'admin') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
          <h1 className="font-heading text-primary-900 text-2xl font-semibold">
            {adminShell.notAdminTitle}
          </h1>
          <p className="mt-2 text-neutral-600">
            {adminShell.notAdminPrefix} {session.user.email}, {adminShell.notAdminSuffix}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <SignOutButton />
            <Link href="/" className="text-primary-700 text-sm underline">
              {adminShell.publicSite}
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // Production administrators must enrol before the dashboard opens. Keep exactly one screen
  // reachable: the security page where Better Auth starts and confirms TOTP enrolment. No
  // counts, navigation or queue data are read on this branch.
  if (await adminTwoFactorPending(session.user)) {
    const pathname = (await headers()).get('x-pathname') ?? '';
    if (pathname !== '/admin/security') redirect('/admin/security');

    return (
      <div className="min-h-screen bg-neutral-100">
        <header className="bg-primary-900 text-white">
          <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 md:px-8">
            <Link
              href="/admin/security"
              className="font-heading truncate text-base font-semibold sm:text-lg"
            >
              {adminShell.brand}
            </Link>
            <SignOutButton className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
          </div>
        </header>

        <Container className="py-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </Container>
      </div>
    );
  }

  // One read for the whole shell: the sidebar badges and the overview queue tiles both use it.
  const counts = await getAdminCounts();

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-primary-900 sticky top-0 z-40 text-white">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <AdminMenu counts={counts} />{' '}
            <Link href="/admin" className="flex min-w-0 items-baseline gap-2">
              <span className="font-heading truncate text-base font-semibold sm:text-lg">
                <span className="sm:hidden">{adminShell.brandShort}</span>
                <span className="hidden sm:inline">{adminShell.brand}</span>
              </span>
              <span className="rounded-full border border-white/30 px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.14em] text-white/80 uppercase">
                {adminShell.section}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <span className="hidden max-w-56 truncate text-white/70 md:inline">
              {adminShell.signedInAs} {session.user.email}
            </span>
            <Link
              href="/"
              className="hidden text-sm text-white/85 underline underline-offset-4 hover:text-white sm:inline"
            >
              {adminShell.publicSite}
            </Link>
            <SignOutButton className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[90rem]">
        <aside className="hidden w-60 shrink-0 border-r border-neutral-300 bg-white lg:block xl:w-64">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
            <AdminNav counts={counts} />
          </div>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-8 md:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[80rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}
