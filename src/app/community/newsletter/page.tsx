import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { newsletterPage } from '@/content/community';
import { NewsletterPreferences, NewsletterSignup } from '@/features/community/newsletter-forms';

export const metadata: Metadata = {
  title: newsletterPage.title,
  description: newsletterPage.description,
  alternates: { canonical: '/community/newsletter' },
};

export default function NewsletterPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Community', href: '/community' }, { label: newsletterPage.title }]}
        title={newsletterPage.title}
        description={newsletterPage.description}
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-primary-900 text-2xl font-semibold">
              {newsletterPage.signupTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{newsletterPage.signupDescription}</p>
            <div className="mt-6">
              <NewsletterSignup />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-primary-900 text-2xl font-semibold">
              {newsletterPage.preferencesTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{newsletterPage.preferencesDescription}</p>
            <div className="mt-6">
              <NewsletterPreferences />
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-neutral-300 bg-neutral-100/60 p-6">
          <h2 className="font-heading text-primary-900 text-xl font-semibold">
            {newsletterPage.archiveTitle}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{newsletterPage.archiveDescription}</p>
          <p className="mt-4 text-sm text-neutral-600">{newsletterPage.archiveEmpty}</p>
        </div>

        <p className="mt-6 text-sm text-neutral-600">
          {newsletterPage.privacyNote}{' '}
          <Link href="/legal/privacy" className="text-primary-700 underline">
            Read the privacy policy
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
