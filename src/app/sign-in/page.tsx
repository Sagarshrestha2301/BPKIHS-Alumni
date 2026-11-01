import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { signInPage } from '@/content/account';
import { SignInForm } from '@/features/auth/sign-in-form';
import { safeReturnPath } from '@/lib/nav';
import { getSession } from '@/server/auth/session';

export const metadata: Metadata = {
  title: signInPage.title,
  description: signInPage.description,
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: true },
};

/** Reads the session to send a signed-in member on, so this route blocks instead of prerendering. */
export const instant = false;

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  // A gated page sends `?next=` so the member lands back where they were. Only a path on
  // this site is honoured, and never the sign-in or admin screens (see `safeReturnPath`).
  const next = safeReturnPath((await searchParams).next);
  const session = await getSession();
  if (session) redirect(next ?? '/account');

  return (
    <Container className="py-12 lg:py-16">
      <div className="card-lift shadow-card mx-auto max-w-md rounded-xl border border-neutral-300 bg-white p-6 ring-1 ring-neutral-200/60 md:p-8">
        <h1 className="font-heading text-primary-900 text-2xl font-semibold">{signInPage.title}</h1>
        <p className="mt-2 text-sm text-neutral-600">{signInPage.description}</p>

        <div className="mt-6">
          <SignInForm next={next} />
        </div>

        <p className="mt-6 text-sm text-neutral-600">
          {signInPage.newHere}{' '}
          <Link href="/register" className="text-primary-700 underline underline-offset-4">
            {signInPage.register}
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          {signInPage.forgotPassword}{' '}
          <Link href="/forgot-password" className="text-primary-700 underline underline-offset-4">
            {signInPage.resetPassword}
          </Link>
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          <Link href="/admin/sign-in" className="text-primary-700 underline underline-offset-4">
            {signInPage.adminSignIn}
          </Link>
        </p>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-primary-700 underline underline-offset-4">
            {signInPage.backToSite}
          </Link>
        </p>
      </div>
    </Container>
  );
}
