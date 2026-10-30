import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { howWeWork } from '@/content/about';
import { HowWeWorkAccordion } from '@/features/governance/how-we-work-accordion';

export const metadata: Metadata = {
  title: howWeWork.title,
  description: howWeWork.description,
  alternates: { canonical: '/about/how-we-work' },
};

export default function HowWeWorkPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About', href: '/about' }, { label: howWeWork.title }]}
        title={howWeWork.title}
        description={howWeWork.description}
      />
      <Section>
        <div className="max-w-3xl">
          <HowWeWorkAccordion />
          <p className="mt-6">
            <Link
              href={howWeWork.faqHref}
              className="text-primary-700 hover:text-primary-900 focus-visible:ring-ring/50 inline-flex min-h-11 items-center rounded-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3"
            >
              {howWeWork.faqLabel}
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
