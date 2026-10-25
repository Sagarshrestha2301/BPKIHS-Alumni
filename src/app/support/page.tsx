import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { supportPage } from '@/content/support';
import { HelpdeskForm } from '@/features/support/helpdesk-form';
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
            <h2 className="font-heading text-primary-900 text-2xl font-semibold">
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
                    className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm"
                  >
                    {contact.href ? (
                      <a href={contact.href} className="block">
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

          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-primary-900 text-2xl font-semibold">
              {supportPage.helpdeskTitle}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">{supportPage.helpdeskDescription}</p>
            <div className="mt-6">
              <HelpdeskForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
