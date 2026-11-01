import { Info } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { registerPage } from '@/content/register';
import { RegisterForm } from '@/features/register/register-form';

export const metadata: Metadata = {
  title: registerPage.title,
  description: registerPage.description,
  alternates: { canonical: '/register' },
};

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Register' }]}
        title={registerPage.title}
        description={registerPage.description}
      />
      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="text-body-l text-neutral-600">{registerPage.intro}</p>
          <div className="border-primary-600 bg-primary-50 text-primary-900 mt-4 rounded-r-lg border-l-4 p-4 text-sm">
            <div className="flex items-start gap-3">
              <Info aria-hidden="true" className="text-primary-600 size-4 shrink-0" />
              {registerPage.reviewNote}
            </div>
          </div>
          <p className="mt-4 text-sm text-neutral-600">
            {registerPage.signIn.prompt}{' '}
            <Link href="/sign-in" className="text-primary-700 underline underline-offset-4">
              {registerPage.signIn.action}
            </Link>
            .
          </p>
        </div>
        <div className="mt-10">
          <RegisterForm />
        </div>
      </Section>
    </>
  );
}
