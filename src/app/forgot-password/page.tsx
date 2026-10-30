import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { forgotPasswordPage } from '@/content/account';
import { ForgotPasswordForm } from '@/features/account/forgot-password-form';

export const metadata: Metadata = {
  title: forgotPasswordPage.title,
  description: forgotPasswordPage.description,
  alternates: { canonical: '/forgot-password' },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-heading text-primary-900 text-2xl font-semibold">
          {forgotPasswordPage.title}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{forgotPasswordPage.description}</p>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-sm">
          <Link href="/" className="text-primary-700 underline underline-offset-4">
            Back to the site
          </Link>
        </p>
      </div>
    </Container>
  );
}
