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

/**
 * The receipt is identified by `?id`, `?status` and the amount in the URL, so the page blocks
 * until those are known instead of flashing a placeholder confirmation.
 */
export const instant = false;

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
        <div className="shadow-card mx-auto max-w-2xl rounded-2xl border border-neutral-300/80 bg-white p-7 md:p-10">
          <div
            className={cn(
              'mb-4 flex size-14 items-center justify-center rounded-2xl shadow-xs ring-1',
              failed
                ? 'bg-danger-100/60 text-danger-600 ring-danger-600/20'
                : 'bg-success-100/60 text-success-600 ring-success-600/20',
            )}
          >
            {failed ? (
              <AlertCircle aria-hidden="true" className="size-7" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-7" />
            )}
          </div>
          <h2 className="font-heading text-primary-900 mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            {failed
              ? thankYouPage.failedTitle
              : pending
                ? thankYouPage.pendingTitle
                : thankYouPage.title}
          </h2>
          <p className="text-body-l mt-2 leading-relaxed text-neutral-600">
            {failed
              ? thankYouPage.failedNote
              : pending
                ? thankYouPage.receiptPendingNote
                : thankYouPage.receiptNote}
          </p>

          <div className="mt-7 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-5">
            <p className="mb-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              Official Gift Details
            </p>
            <dl className="grid gap-3 text-sm">
              {goal ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">{thankYouPage.labels.goal}</dt>
                  <dd className="text-right font-medium text-neutral-900">{goal}</dd>
                </div>
              ) : null}
              {Number.isFinite(amount) && amount > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">{thankYouPage.labels.amount}</dt>
                  <dd className="font-semibold text-neutral-900">{formatNpr(amount)}</dd>
                </div>
              ) : null}
              {method ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">{thankYouPage.labels.method}</dt>
                  <dd className="font-medium text-neutral-900">{method}</dd>
                </div>
              ) : null}
              {id ? (
                <div className="flex justify-between gap-4 border-t border-neutral-200/80 pt-3">
                  <dt className="text-neutral-600">{thankYouPage.labels.reference}</dt>
                  <dd className="text-primary-900 rounded border border-neutral-200 bg-white px-2 py-0.5 font-mono text-xs font-semibold">
                    {id}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {thankYouPage.nextSteps.map((step) => (
              <Link
                key={step.href}
                href={step.href}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'btn-press h-11 px-5 text-base font-medium',
                )}
              >
                {step.label}
              </Link>
            ))}
          </div>
          <p className="mt-5">
            <Link
              href="/donate"
              className="text-primary-700 hover:text-primary-900 text-sm font-semibold underline underline-offset-4"
            >
              {thankYouPage.backToGoals}
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
