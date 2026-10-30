import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { resetPasswordPage } from '@/content/account';
import { ResetPasswordForm } from '@/features/account/reset-password-form';

export const metadata: Metadata = {
  title: resetPasswordPage.title,
  description: resetPasswordPage.description,
  robots: { index: false, follow: false },
};

/** Reads the token from the query string, so the route blocks rather than prerenders. */
export const instant = false;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const token = firstValue((await searchParams).token);

  return (
    <Container className="py-12 lg:py-16">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
        <h1 className="font-heading text-primary-900 text-2xl font-semibold">
          {resetPasswordPage.title}
        </h1>

        {token ? (
          <>
            <p className="mt-2 text-sm text-neutral-600">{resetPasswordPage.description}</p>
            <div className="mt-6">
              <ResetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <>
            <p
              role="alert"
              className="text-danger-600 border-danger-600/30 bg-danger-600/5 mt-4 rounded-lg border p-3 text-sm font-medium"
            >
              {resetPasswordPage.invalid}
            </p>
            <p className="mt-6 text-sm">
              <Link
                href="/forgot-password"
                className="text-primary-700 underline underline-offset-4"
              >
                {resetPasswordPage.requestNew}
              </Link>
            </p>
          </>
        )}

        <p className="mt-6 text-sm">
          <Link href="/sign-in" className="text-primary-700 underline underline-offset-4">
            {resetPasswordPage.signIn}
          </Link>
        </p>
      </div>
    </Container>
  );
}
