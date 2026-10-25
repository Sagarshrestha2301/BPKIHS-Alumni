import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { buttonVariants } from '@/components/ui/button';
import { transparencyPage } from '@/content/donate';
import { getDonationGoals, getFundsBreakdown } from '@/features/donations/get-donate-data';
import { formatNpr } from '@/lib/format/money';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: transparencyPage.title,
  description: transparencyPage.description,
  alternates: { canonical: '/donate/transparency' },
};

const chartColours = [
  'var(--color-primary-700)',
  'var(--color-primary-500)',
  'var(--color-accent-500)',
  'var(--color-neutral-600)',
] as const;

function donutGradient(shares: readonly number[]): string {
  let start = 0;
  const stops = shares.map((share, index) => {
    const end = start + share;
    const colour = chartColours[index % chartColours.length];
    const stop = `${colour} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

export default async function TransparencyPage() {
  const [funds, goals] = await Promise.all([getFundsBreakdown(), getDonationGoals()]);
  const totalRaised = goals.reduce((sum, goal) => sum + goal.raisedMinor, 0);
  const activeGoals = goals.length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Donate', href: '/donate' }, { label: transparencyPage.title }]}
        title={transparencyPage.title}
        description={transparencyPage.description}
      />

      <Section>
        <p className="text-body-l max-w-3xl text-neutral-600">{transparencyPage.intro}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-600">{transparencyPage.totalRaised}</p>
            <p className="font-heading text-primary-900 mt-1 text-3xl font-semibold">
              {formatNpr(totalRaised)}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-600">{transparencyPage.totalGoals}</p>
            <p className="font-heading text-primary-900 mt-1 text-3xl font-semibold">
              {activeGoals}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start">
          <div
            role="img"
            aria-label="Fund allocation by category, also given as a table"
            className="mx-auto size-56 rounded-full"
            style={{ background: donutGradient(funds.map((item) => item.sharePercent)) }}
          >
            <div className="flex size-full items-center justify-center">
              <div className="grid size-32 place-items-center rounded-full bg-white text-center shadow-sm">
                <span className="text-sm text-neutral-600">Allocated</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-300 bg-white shadow-sm">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">{transparencyPage.title}</caption>
              <thead className="bg-neutral-100 text-neutral-900">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {transparencyPage.table.category}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    {transparencyPage.table.share}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    {transparencyPage.table.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {funds.map((item, index) => (
                  <tr key={item.category} className="border-t border-neutral-300">
                    <th scope="row" className="px-4 py-3 font-medium text-neutral-900">
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block size-3 rounded-full align-middle"
                        style={{ background: chartColours[index % chartColours.length] }}
                      />
                      {item.category}
                    </th>
                    <td className="px-4 py-3 text-right tabular-nums">{item.sharePercent}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNpr(item.amountMinor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-sm text-neutral-600">{transparencyPage.note}</p>
        <div className="mt-6">
          <Link href="/donate" className={cn(buttonVariants(), 'h-11 px-5 text-base')}>
            Back to giving goals
          </Link>
        </div>
      </Section>
    </>
  );
}
