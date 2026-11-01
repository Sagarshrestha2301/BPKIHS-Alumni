import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { supportPage } from '@/content/support';
import { HelpdeskPanel } from '@/features/support/helpdesk-panel';
import { cn } from '@/lib/utils';
import { contactDetails } from '@/server/contact';

export const metadata: Metadata = {
  title: supportPage.title,
  description: supportPage.description,
  alternates: { canonical: '/support' },
};

const icons = {
  email: Mail,
  phone: Phone,
  address: MapPin,
  hours: Clock,
} as const;

export default function SupportPage() {
  const contacts = contactDetails();

  return (
    <>
      <PageHeader
        crumbs={[{ label: supportPage.title }]}
        title={supportPage.title}
        description={supportPage.description}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:items-start">
          <aside>
            <h2 className="font-heading text-primary-900 text-2xl font-bold tracking-tight">
              {supportPage.contactTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{supportPage.contactNote}</p>
            <ul className="mt-5 grid gap-3">
              {contacts.map((contact) => {
                const Icon = icons[contact.key];
                const content = (
                  <>
                    <span className="text-primary-900 flex items-center gap-2 text-sm font-semibold">
                      <Icon aria-hidden="true" className="size-4" />
                      {supportPage.contactLabels[contact.key]}
                    </span>
                    <span className="mt-1 block text-sm text-neutral-600">{contact.value}</span>
                  </>
                );
                return (
                  <li
                    key={contact.key}
                    /* Only the linked tiles respond to hover: a lift must promise a click. */
                    className={cn(
                      'rounded-xl border border-neutral-300 bg-white p-4 shadow-xs',
                      contact.href && 'group card-lift hover:border-primary-300',
                    )}
                  >
                    {contact.href ? (
                      <a
                        href={contact.href}
                        className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3"
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-neutral-600">{supportPage.responseNote}</p>
            <Link
              href="/support/faq"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-5 h-11 px-5')}
            >
              {supportPage.faqCta}
            </Link>
          </aside>
          <section
            aria-labelledby="helpdesk-heading"
            className="shadow-card rounded-xl border border-neutral-200 bg-white p-6 md:p-8"
          >
            <h2
              id="helpdesk-heading"
              className="font-heading text-primary-900 text-2xl font-semibold"
            >
              {supportPage.helpdeskTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{supportPage.helpdeskDescription}</p>
            <div className="mt-6">
              <Suspense
                fallback={
                  <div
                    aria-hidden="true"
                    className="h-64 animate-pulse rounded-lg bg-neutral-100"
                  />
                }
              >
                <HelpdeskPanel />
              </Suspense>
            </div>
          </section>
        </div>
      </Section>
    </>
  );
}
