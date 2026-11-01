import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/layout/section';
import { DonateLink } from '@/components/shared/donate-link';
import { ProgressBar } from '@/components/shared/progress-bar';
import { SectionHeading } from '@/components/shared/section-heading';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { donatePage } from '@/content/donate';
import {
  getCachedNow,
  getGoalExactly,
  getGoalStats,
  getGoalUpdates,
  getRecentDonors,
} from '@/features/donations/get-donate-data';
import {
  goalAverageGiftMinor,
  goalPercentRaised,
  goalRemainingMinor,
  goalStatus,
  type GoalTimeLeft,
  goalTimeLeft,
} from '@/features/donations/goal-summary';
import { formatDate } from '@/lib/format/dates';
import { formatNpr, formatNprCompact } from '@/lib/format/money';
import { cn } from '@/lib/utils';
import type { GoalGiftStat } from '@/server/services/donations';

type Params = { id: string };

type DonationGoal = NonNullable<Awaited<ReturnType<typeof getGoalExactly>>>;

/**
 * The goal id determines the page title, metadata, donation link and every detail-panel read.
 * This route therefore has no URL-independent shell to prefetch; render it per navigation.
 */
export const instant = false;

/** Chrome for the goal detail page; only a goal that exists can be indexed. */
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const goal = await getGoalExactly(id);
  return {
    title: goal ? `${goal.title} : ${donatePage.title}` : donatePage.title,
    description: goal?.description ?? donatePage.description,
    alternates: { canonical: `/donate/goals/${id}` },
    ...(goal ? {} : { robots: { index: false, follow: false } }),
  };
}

/** "Closes in 12 days" / "Closes tomorrow", assembled from the pure helper and shared words. */
function timeLabel(time: GoalTimeLeft | null): string | null {
  if (!time) return null;
  const words = donatePage.goalTimeWords;
  if (time.kind === 'today') return words.today;
  if (time.kind === 'tomorrow') return words.tomorrow;
  if (time.kind === 'days') return `${words.prefix} ${time.count} ${words.days}`;
  return `${words.prefix} ${time.count} ${words.months}`;
}

/** Confirmed gifts toward this goal; the same privacy rules as the transparency page. */
async function GoalDonors({ goal }: { goal: DonationGoal }) {
  const copy = donatePage.goalDetail;
  const donors = await getRecentDonors({ goalId: goal.id });

  if (donors.total === 0) {
    // The office has not recorded anything yet; say so instead of showing an empty list.
    return (
      <p className="neutral-border-300 rounded-xl border p-5 text-neutral-600">{copy.empty}</p>
    );
  }

  return (
    <ul className="grid gap-2">
      {donors.items.map((donor, index) => (
        <li
          key={`${index}:${donor.givenAt}`}
          className="flex items-baseline justify-between gap-4 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm"
        >
          <span className="font-medium text-neutral-900">{donor.name ?? copy.anonymous}</span>
          <time dateTime={donor.givenAt} className="text-neutral-600">
            {formatDate(donor.givenAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}

/** One cell of the "this goal in numbers" strip; divs wrap dt/dd pairs inside a dl. */
function StatCell({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="bg-white px-5 py-4 first:rounded-tl-xl last:rounded-br-xl sm:first:rounded-none sm:last:rounded-none">
      <dt className="text-sm text-neutral-600">{term}</dt>
      <dd className="font-heading text-primary-900 mt-1 text-lg font-semibold">{children}</dd>
    </div>
  );
}

export default async function GoalPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const goal = await getGoalExactly(id);
  if (!goal) notFound();

  const copy = donatePage.goalDetail;
  // One aggregate read feeds all four numbers below; counts and dates only, no donor rows.
  const stats = await getGoalStats();
  const stat: GoalGiftStat | undefined = stats.perGoal.find((item) => item.goalId === goal.id);
  const gifts = stat?.gifts ?? 0;

  // The clock comes from a cached scope: a bare `new Date()` here would block prerender.
  const now = await getCachedNow();
  const status = goalStatus(goal, now);
  const percent = goalPercentRaised(goal);
  const remaining = goalRemainingMinor(goal);
  const average = goalAverageGiftMinor(goal, gifts);
  // Share of all confirmed online giving, general fund included; zero when nothing confirmed.
  const share =
    stats.amountMinor > 0 ? Math.round((goal.raisedMinor / stats.amountMinor) * 100) : 0;
  const time = goal.deadline ? goalTimeLeft(goal.deadline, now) : null;
  // Countdown only while the goal can still be given to; a closed goal shows its close day.
  const countdown = status === 'reached' || status === 'ended' ? null : timeLabel(time);
  // The Association's own words about how the work is going, newest first.
  const updates = await getGoalUpdates(goal.id);

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Donate', href: '/donate' }, { label: goal.title }]}
        title={goal.title}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            {/* The office writes the description; a blank line in the editor stays a
                paragraph break, so the long form is never one dense block. */}
            <div className="text-body-l max-w-2xl space-y-4 text-neutral-600">
              {goal.description.split(/\n{2,}|\n/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {goal.imageUrl ? (
              <div className="mt-8 overflow-hidden rounded-xl border border-neutral-300">
                <Image
                  src={goal.imageUrl}
                  alt={goal.title}
                  width={960}
                  height={480}
                  // One column on phones, the two-column main area from the desktop break.
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="h-56 w-full object-cover sm:h-72"
                />
              </div>
            ) : null}

            {/* The progress panel: percent raised, the bar, and the actionable remainder. */}
            <div className="mt-8 rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-primary-900 text-xl font-semibold">
                  {percent}% raised
                </h2>
                <Badge variant={status === 'open' ? 'outline' : 'default'}>
                  {donatePage.goalStatus[status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {formatNpr(goal.raisedMinor)} {donatePage.goalStats.raisedOf}{' '}
                {formatNpr(goal.targetMinor)} {donatePage.goalStats.targetWord}
              </p>

              <div className="mt-4">
                <ProgressBar
                  label={goal.title}
                  raised={goal.raisedMinor}
                  target={goal.targetMinor}
                  raisedLabel={formatNprCompact(goal.raisedMinor)}
                  targetLabel={formatNprCompact(goal.targetMinor)}
                />
              </div>

              {remaining > 0 ? (
                <p className="mt-3 text-sm text-neutral-600">
                  <span className="text-primary-900 font-semibold">{formatNpr(remaining)}</span>{' '}
                  {donatePage.goalStats.remaining}
                  {countdown ? ` · ${countdown}` : ''}
                </p>
              ) : null}

              {goal.deadline && status === 'ended' ? (
                <p className="mt-3 text-sm text-neutral-600">
                  {donatePage.goalTimeWords.ended} {formatDate(goal.deadline)}
                </p>
              ) : null}
            </div>

            <div className="mt-10 max-w-2xl">
              <SectionHeading title={copy.statsTitle} as="h2" />
              {/* Hairline-gap grid: one read, four numbers, no card-in-card clutter. */}
              <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border border-neutral-300 bg-neutral-200 sm:grid-cols-3">
                <StatCell term={donatePage.goalStats.gifts}>{gifts}</StatCell>
                <StatCell term={donatePage.goalStats.average}>
                  {average > 0 ? formatNpr(average) : donatePage.goalStats.emptyLatest}
                </StatCell>
                <StatCell term={donatePage.goalStats.latest}>
                  {stat?.latestGiftAt
                    ? formatDate(stat.latestGiftAt)
                    : donatePage.goalStats.emptyLatest}
                </StatCell>
              </dl>
              {share > 0 ? (
                <p className="mt-3 text-sm text-neutral-600">
                  {donatePage.goalStats.share}:{' '}
                  <span className="font-semibold text-neutral-900">{share}%</span>.{' '}
                  {donatePage.goalStats.shareNote}
                </p>
              ) : null}
            </div>

            {updates.length > 0 ? (
              <div className="mt-10 max-w-2xl">
                <SectionHeading title={copy.updatesTitle} description={copy.updatesNote} as="h2" />
                <ol className="mt-4 space-y-3">
                  {updates.map((update) => (
                    <li
                      key={update.id}
                      className="rounded-xl border border-neutral-300 bg-white p-5"
                    >
                      <time
                        dateTime={update.createdAt}
                        className="text-primary-700 text-xs font-semibold tracking-wide uppercase"
                      >
                        {formatDate(update.createdAt)}
                      </time>
                      <p className="mt-2 leading-relaxed text-neutral-600">
                        {update.body.split(/\n{2,}|\n/).map((paragraph, index) => (
                          <span key={index} className={`block${index > 0 ? 'mt-2' : ''}`}>
                            {paragraph}
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="mt-10 max-w-2xl">
              <SectionHeading title={copy.recentTitle} description={copy.recentNote} as="h2" />
              <div className="mt-4">
                <GoalDonors goal={goal} />
              </div>
              <p className="mt-4">
                <Link href="/donate/transparency" className="text-primary-700 underline">
                  {copy.transparencyLink}
                </Link>
              </p>
            </div>
          </div>

          <aside className="space-y-4">
            <DonateLink
              href={`/donate/checkout?goal=${encodeURIComponent(goal.id)}`}
              aria-label={`${copy.give}: ${goal.title}`}
              className="h-11 w-full"
            >
              {copy.give}
            </DonateLink>
            <p className="text-sm text-neutral-600">{donatePage.paymentNote}</p>
            <p className="text-sm text-neutral-600">
              {goal.deadline ? `${copy.deadline} ${formatDate(goal.deadline)}` : null}
            </p>
            <Link
              href="/donate"
              className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5')}
            >
              {copy.backToGoals}
            </Link>
          </aside>
        </div>
      </Section>
    </>
  );
}
