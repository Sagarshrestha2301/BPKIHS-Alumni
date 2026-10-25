import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { adminSignIn } from '@/content/admin';
import { AdminSignIn } from '@/features/admin/admin-sign-in';
import { getSession } from '@/server/auth/session';

export const metadata: Metadata = {
  title: adminSignIn.title,
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage() {
  const session = await getSession();
  if (session?.user.role === 'admin') redirect('/admin');

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-heading text-primary-900 text-2xl font-semibold">
          {adminSignIn.title}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{adminSignIn.description}</p>
        <div className="mt-6">
          <AdminSignIn />
        </div>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-primary-700 underline underline-offset-4">
            {adminSignIn.backToSite}
          </Link>
        </p>
      </div>
    </Container>
  );
}
