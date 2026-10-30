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

/**
 * Reads the result of an email link (`?unsubscribed=`, `?confirmed=`), so the route blocks
 * instead of prerendering.
 */
export const instant = false;

export default async function NewsletterPage({ searchParams }: PageProps<'/community/newsletter'>) {
  const params = await searchParams;
  const status = params.unsubscribed;
  const confirmed = params.confirmed;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Community', href: '/community' }, { label: newsletterPage.title }]}
        title={newsletterPage.title}
        description={newsletterPage.description}
      />

      <Section>
        {confirmed === 'done' ? (
          <p
            role="status"
            className="mb-6 rounded-lg border border-neutral-300 bg-neutral-100 p-4 text-sm text-neutral-900"
          >
            {newsletterPage.confirmedDone}
          </p>
        ) : null}
        {confirmed === 'invalid' ? (
          <p
            role="status"
            className="mb-6 rounded-lg border border-neutral-300 bg-neutral-100 p-4 text-sm text-neutral-900"
          >
            {newsletterPage.confirmedInvalid}
          </p>
        ) : null}
        {status === 'done' ? (
          <p
            role="status"
            className="mb-6 rounded-lg border border-neutral-300 bg-neutral-100 p-4 text-sm text-neutral-900"
          >
            {newsletterPage.unsubscribeConfirmed}
          </p>
        ) : null}
        {status === 'unknown' ? (
          <p
            role="status"
            className="mb-6 rounded-lg border border-neutral-300 bg-neutral-100 p-4 text-sm text-neutral-900"
          >
            {newsletterPage.unsubscribeUnknown}
          </p>
        ) : null}

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
