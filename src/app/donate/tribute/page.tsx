import { Heart, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { tributePage } from '@/content/donate';
import { TributeForm } from '@/features/donations/tribute-form';

export const metadata: Metadata = {
  title: tributePage.title,
  description: tributePage.description,
  alternates: { canonical: '/donate/tribute' },
};

export default function TributePage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Donate', href: '/donate' }, { label: tributePage.title }]}
        title={tributePage.title}
        description={tributePage.description}
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
            <Sparkles aria-hidden="true" className="text-accent-600 size-6" />
            <h2 className="font-heading text-primary-900 mt-3 text-2xl font-semibold">
              {tributePage.inHonour}
            </h2>
            <p className="mt-2 text-neutral-600">
              Mark a milestone, thank a mentor, or celebrate a batch that shaped your years at
              BPKIHS.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
            <Heart aria-hidden="true" className="text-accent-600 size-6" />
            <h2 className="font-heading text-primary-900 mt-3 text-2xl font-semibold">
              {tributePage.inMemory}
            </h2>
            <p className="mt-2 text-neutral-600">
              Remember someone who is no longer with us with a gift that supports the next
              generation.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <TributeForm />

          <aside className="rounded-xl border border-neutral-300 bg-neutral-100/60 p-6">
            <h2 className="font-heading text-primary-900 text-xl font-semibold">
              {tributePage.wallTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{tributePage.wallNote}</p>
            <ul className="mt-5 grid gap-4">
              {tributePage.wall.map((entry) => (
                <li key={entry.id} className="border-accent-500 border-l-2 pl-3">
                  <p className="text-accent-700 text-xs font-semibold tracking-wide uppercase">
                    {entry.type === 'in_memory' ? tributePage.inMemory : tributePage.inHonour}
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">{entry.name}</p>
                  <p className="mt-1 text-sm text-neutral-600">{entry.message}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="mt-12">
          <SectionHeading
            title="Every gift has a purpose"
            description="Tribute gifts follow the same goals and the same transparency as any other donation."
          />
        </div>
      </Section>
    </>
  );
}
