import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Container } from '@/components/layout/container';
import { signInPage } from '@/content/account';
import { SignInForm } from '@/features/auth/sign-in-form';
import { getSession } from '@/server/auth/session';

export const metadata: Metadata = {
  title: signInPage.title,
  description: signInPage.description,
  alternates: { canonical: '/sign-in' },
  robots: { index: false, follow: true },
};

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect('/account');

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-heading text-primary-900 text-2xl font-semibold">{signInPage.title}</h1>
        <p className="mt-2 text-sm text-neutral-600">{signInPage.description}</p>

        <div className="mt-6">
          <SignInForm />
        </div>

        <p className="mt-6 text-sm text-neutral-600">
          {signInPage.newHere}{' '}
          <Link href="/register" className="text-primary-700 underline underline-offset-4">
            {signInPage.register}
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-neutral-600">{signInPage.forgotPassword}</p>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-primary-700 underline underline-offset-4">
            {signInPage.backToSite}
          </Link>
        </p>
      </div>
    </Container>
  );
}
