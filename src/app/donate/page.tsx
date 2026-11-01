import { ArrowRight, Check, HeartHandshake, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { buttonVariants } from '@/components/ui/button';
import { donatePage } from '@/content/donate';
import { FundsSkeleton } from '@/features/donations/funds-skeleton';
import {
  getCachedNow,
  getDonationGoals,
  getFundsBreakdown,
  getGoalGiftStats,
} from '@/features/donations/get-donate-data';
import { GoalCard } from '@/features/donations/goal-card';
import { GoalCardsSkeleton } from '@/features/donations/goal-cards-skeleton';
import { formatNpr } from '@/lib/format/money';
import { cn } from '@/lib/utils';
// The office's legal identifiers and bank account come from the environment; when they are
// unset the sections below simply do not render.
import { offlineGiving, receiptDetails } from '@/server/giving-details';

export const metadata: Metadata = {
  title: donatePage.title,
  description: donatePage.description,
  alternates: { canonical: '/donate' },
};

const linkClass = cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base');

/**
 * The two database reads are streamed separately instead of gating the whole page: the
 * header, intro and side panels are static and paint at once, while the goal grid and the
 * funds breakdown each arrive with their own skeleton (the home page's pattern). One read
 * being slow no longer holds the other hostage.
 */
async function GoalCards() {
  // One cached aggregate read feeds the gift line on every card below; the clock is cached
  // too, because `goalStatus` inside the cards needs a time that can be prerendered.
  const [goals, giftStats, now] = await Promise.all([
    getDonationGoals(),
    getGoalGiftStats(),
    getCachedNow(),
  ]);

  if (goals.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-neutral-300 bg-white p-6">
        <p className="text-neutral-700">{donatePage.noGoals}</p>
        <Link href="/donate/checkout" className={cn(buttonVariants(), 'mt-4 h-11 px-5')}>
          {donatePage.generalFund}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} stats={giftStats[goal.id]} now={now} />
      ))}
    </div>
  );
}

async function FundsBreakdown() {
  const funds = await getFundsBreakdown();

  if (funds.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-neutral-600">
        {donatePage.funds.empty}
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-3">
      {funds.map((item) => (
        <div
          key={item.category}
          className="grid gap-2 rounded-lg border border-neutral-300 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div>
            <p className="font-medium text-neutral-900">{item.category}</p>
            <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-neutral-100">
              <div
                className="bg-primary-700 h-full rounded-full"
                style={{ width: `${item.sharePercent}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="text-sm text-neutral-600 sm:text-right">
            <span className="text-primary-900 block font-semibold">
              {formatNpr(item.amountMinor)}
            </span>
            {item.sharePercent}% of confirmed online gifts
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DonatePage() {
  const legal = receiptDetails();
  const offline = offlineGiving();
  const hasBankAccount = Boolean(offline.bankName || offline.accountName || offline.accountNumber);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Donate' }]}
        title={donatePage.title}
        description={donatePage.description}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <p className="text-body-l max-w-2xl text-neutral-600">{donatePage.intro}</p>
            <p className="mt-3">
              <Link href="/donate/transparency" className="text-primary-700 font-medium underline">
                {donatePage.transparencyLink}
              </Link>
            </p>

            <div className="mt-10">
              <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                {donatePage.goalsHeading}
              </h2>
              <Suspense fallback={<GoalCardsSkeleton />}>
                <GoalCards />
              </Suspense>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-primary-900 text-xl font-semibold">
                {donatePage.quickAmounts.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-600">{donatePage.quickAmounts.description}</p>
              <ul className="mt-5 grid grid-cols-2 gap-2">
                {donatePage.quickAmounts.amounts.map((amount) => (
                  <li key={amount}>
                    <Link
                      href={`/donate/checkout?amount=${amount}`}
                      className={cn(buttonVariants({ variant: 'outline' }), 'h-11 w-full')}
                    >
                      {formatNpr(amount)}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="border-accent-600/30 bg-accent-100 text-accent-700 mt-4 rounded-lg border p-3 text-sm">
                {donatePage.paymentNote}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
              <ShieldCheck aria-hidden="true" className="text-primary-700 size-6" />
              <h2 className="font-heading text-primary-900 mt-3 text-xl font-semibold">
                {donatePage.trust.title}
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-neutral-600">
                {donatePage.trust.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check
                      aria-hidden="true"
                      size={16}
                      className="text-success-600 mt-0.5 shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/support"
                className="text-primary-700 mt-4 inline-block text-sm underline"
              >
                {donatePage.trust.support}
              </Link>
              {legal.length > 0 ? (
                <dl className="mt-5 border-t border-neutral-300 pt-4 text-sm">
                  {legal.map((detail) => (
                    <div key={detail.key} className="flex justify-between gap-3 py-1">
                      <dt className="text-neutral-600">
                        {detail.key === 'pan'
                          ? donatePage.legal.pan
                          : donatePage.legal.registration}
                      </dt>
                      <dd className="font-medium text-neutral-900">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="muted" aria-label={donatePage.funds.title}>
        <SectionHeading title={donatePage.funds.title} description={donatePage.funds.description} />
        <Suspense fallback={<FundsSkeleton />}>
          <FundsBreakdown />
        </Suspense>
        <div className="mt-6">
          <Link href="/donate/transparency" className={linkClass}>
            {donatePage.funds.link}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {hasBankAccount ? (
        <Section tone="muted" aria-label={donatePage.offline.title}>
          <SectionHeading title={donatePage.offline.title} description={donatePage.offline.intro} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <dl className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
              {offline.bankName ? (
                <div className="flex justify-between gap-4 py-1 text-sm">
                  <dt className="text-neutral-600">{donatePage.offline.labels.bank}</dt>
                  <dd className="text-right font-medium text-neutral-900">{offline.bankName}</dd>
                </div>
              ) : null}
              {offline.accountName ? (
                <div className="flex justify-between gap-4 py-1 text-sm">
                  <dt className="text-neutral-600">{donatePage.offline.labels.accountName}</dt>
                  <dd className="text-right font-medium text-neutral-900">{offline.accountName}</dd>
                </div>
              ) : null}
              {offline.accountNumber ? (
                <div className="flex justify-between gap-4 py-1 text-sm">
                  <dt className="text-neutral-600">{donatePage.offline.labels.accountNumber}</dt>
                  <dd className="text-right font-mono font-medium text-neutral-900">
                    {offline.accountNumber}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
              <h3 className="font-heading text-primary-900 text-lg font-semibold">
                {donatePage.offline.reportTitle}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">{donatePage.offline.reportText}</p>
              {offline.contactEmail ? (
                <a
                  href={`mailto:${offline.contactEmail}`}
                  className="text-primary-700 mt-4 inline-block text-sm font-medium underline underline-offset-4"
                >
                  {donatePage.offline.contactLabel}
                </a>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      <Section aria-label={donatePage.tribute.title}>
        <div className="grid items-center gap-6 rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <HeartHandshake aria-hidden="true" className="text-accent-600 size-7" />
            <h2 className="font-heading text-primary-900 mt-3 text-2xl font-semibold">
              {donatePage.tribute.title}
            </h2>
            <p className="text-body-l mt-2 max-w-2xl text-neutral-600">
              {donatePage.tribute.description}
            </p>
          </div>
          <Link href="/donate/tribute" className={cn(linkClass, 'whitespace-nowrap')}>
            {donatePage.tribute.link}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </>
  );
}
