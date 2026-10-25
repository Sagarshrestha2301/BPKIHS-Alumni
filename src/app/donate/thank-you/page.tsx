import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { thankYouPage } from '@/content/donate';
import { formatNpr } from '@/lib/format/money';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: thankYouPage.title,
  description: thankYouPage.description,
  alternates: { canonical: '/donate/thank-you' },
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const id = first(params.id);
  const amount = Number(first(params.amount));
  const goal = first(params.goal);
  const method = first(params.method);
  const status = first(params.status);
  const pending = status === 'pending';
  const failed = status === 'failed';

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Donate', href: '/donate' }, { label: 'Thank you' }]}
        title={thankYouPage.title}
        description={thankYouPage.description}
      />
      <Section>
        <div className="mx-auto max-w-2xl rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
          {failed ? (
            <AlertCircle aria-hidden="true" className="text-danger-600 size-10" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="text-success-600 size-10" />
          )}
          <h2 className="font-heading text-primary-900 mt-4 text-2xl font-semibold">
            {failed
              ? thankYouPage.failedTitle
              : pending
                ? thankYouPage.pendingTitle
                : thankYouPage.title}
          </h2>
          <p className="text-body-l mt-2 text-neutral-600">
            {failed
              ? thankYouPage.failedNote
              : pending
                ? thankYouPage.receiptPendingNote
                : thankYouPage.receiptNote}
          </p>

          <dl className="mt-6 grid gap-3 border-t border-neutral-300 pt-4 text-sm">
            {goal ? (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Goal</dt>
                <dd className="text-right font-medium text-neutral-900">{goal}</dd>
              </div>
            ) : null}
            {Number.isFinite(amount) && amount > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Amount</dt>
                <dd className="font-medium text-neutral-900">{formatNpr(amount)}</dd>
              </div>
            ) : null}
            {method ? (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Method</dt>
                <dd className="font-medium text-neutral-900">{method}</dd>
              </div>
            ) : null}
            {id ? (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Reference</dt>
                <dd className="font-mono text-neutral-900">{id}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {thankYouPage.nextSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
              >
                {step.label}
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
