import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Container } from '@/components/layout/container';
import { adminShell } from '@/content/admin';
import { AdminNav } from '@/features/admin/admin-nav';
import { SignOutButton } from '@/features/admin/sign-out-button';
import { getSession } from '@/server/auth/session';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

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

  return (
    <>
      <div className="border-b border-neutral-300 bg-neutral-100">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heading text-primary-900 text-lg font-semibold">Admin</span>
            <span className="text-sm text-neutral-600">{session.user.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary-700 text-sm underline underline-offset-4">
              {adminShell.publicSite}
            </Link>
            <SignOutButton />
          </div>
        </Container>
      </div>
      <div className="border-b border-neutral-300 bg-white">
        <Container>
          <AdminNav />
        </Container>
      </div>
      <Container className="py-8 lg:py-10">{children}</Container>
    </>
  );
}
