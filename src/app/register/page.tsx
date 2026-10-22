import type { Metadata } from 'next';

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
          <p className="border-primary-100 bg-primary-100/50 text-primary-900 mt-3 rounded-lg border p-4 text-sm">
            {registerPage.reviewNote}
          </p>
        </div>
        <div className="mt-10">
          <RegisterForm />
        </div>
      </Section>
    </>
  );
}
