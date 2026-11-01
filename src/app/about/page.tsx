import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { aboutPage } from '@/content/about';
import { site } from '@/content/site';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'About us',
  description: aboutPage.description,
  alternates: { canonical: '/about' },
};

const linkClass = cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base');
const aboutCardClass =
  'card-lift rounded-xl border border-neutral-300 bg-white p-6 shadow-sm transition-all duration-240 hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-md motion-safe:hover:-translate-y-1';

export default function AboutPage() {
  const { mission, vision, whatWeDo, institute } = aboutPage;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About' }]}
        title={aboutPage.title}
        description={aboutPage.description}
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {[mission, vision].map((block) => (
            <article key={block.title} className={aboutCardClass}>
              <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                {block.title}
              </h2>
              <p className="text-body-l mt-3 text-neutral-600">{block.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="muted" aria-label={whatWeDo.title}>
        <SectionHeading eyebrow={whatWeDo.eyebrow} title={whatWeDo.title} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whatWeDo.items.map((item) => (
            <article key={item.key} className={aboutCardClass}>
              <h3 className="font-heading text-primary-900 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-neutral-600">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="tint" aria-label={institute.title}>
        <p className="text-eyebrow text-primary-500 mb-2 text-xs font-semibold tracking-widest uppercase">
          Our Roots
        </p>
        <h2 className="font-heading text-primary-900 text-2xl font-semibold">{institute.title}</h2>
        <p className="text-body-l mt-3 max-w-2xl text-neutral-600">{institute.text}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={site.instituteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(linkClass, 'animate-fade-up')}
            style={{ animationDelay: '0ms' }}
          >
            {institute.linkLabel}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link
            href="/about/board"
            className={cn(linkClass, 'animate-fade-up')}
            style={{ animationDelay: '80ms' }}
          >
            Meet the board
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link
            href="/about/how-we-work"
            className={cn(linkClass, 'animate-fade-up')}
            style={{ animationDelay: '160ms' }}
          >
            How we work with BPKIHS
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </>
  );
}
