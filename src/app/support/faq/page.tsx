import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { faqPage } from '@/content/support';
import { FaqBrowser } from '@/features/support/faq-browser';
import { getFaqItems } from '@/features/support/get-faq';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: faqPage.title,
  description: faqPage.description,
  alternates: { canonical: '/support/faq' },
};

export default async function FaqPage() {
  const items = await getFaqItems();

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Support', href: '/support' }, { label: faqPage.title }]}
        title={faqPage.title}
        description={faqPage.description}
      />

      <Section>
        <div className="mx-auto max-w-4xl">
          <FaqBrowser items={items} />

          <div className="border-primary-100 bg-primary-100/50 mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-6">
            <p className="text-primary-900 text-lg font-semibold">{faqPage.stillNeedHelp}</p>
            <Link href="/support" className={cn(buttonVariants(), 'h-11 px-5 text-base')}>
              {faqPage.contactCta}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
