import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import type { LegalDocument } from '@/content/legal';

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: document.title }]}
        title={document.title}
        description={document.description}
      />
      <Section>
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[14rem_1fr] lg:items-start">
          <nav
            aria-label="On this page"
            className="hidden rounded-xl border border-neutral-300 bg-white p-4 text-sm shadow-sm lg:sticky lg:top-24 lg:block print:hidden"
          >
            <p className="text-primary-900 font-semibold">On this page</p>
            <ol className="mt-3 grid gap-2">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-primary-700 underline-offset-4 hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="max-w-3xl">
            <p className="border-warning-600/30 bg-warning-600/5 rounded-lg border p-3 text-sm text-neutral-900">
              Draft for legal review. This is not yet the Association&apos;s final policy.
              <span className="mt-1 block text-neutral-600">Last updated: {document.updated}</span>
            </p>

            {document.intro.map((paragraph) => (
              <p key={paragraph} className="text-body-l mt-4 leading-relaxed text-neutral-600">
                {paragraph}
              </p>
            ))}

            <div className="mt-8 grid gap-8">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
                  <h2
                    id={`${section.id}-heading`}
                    className="font-heading text-primary-900 text-2xl font-semibold"
                  >
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="mt-3 leading-relaxed text-neutral-600">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </article>
        </div>
      </Section>
    </>
  );
}
