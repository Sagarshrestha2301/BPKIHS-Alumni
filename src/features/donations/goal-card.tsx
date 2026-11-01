import Link from 'next/link';

import { DonateLink } from '@/components/shared/donate-link';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { donatePage } from '@/content/donate';
import type { DonationGoal } from '@/lib/api/types';
import { formatDate } from '@/lib/format/dates';
import { formatNpr, formatNprCompact } from '@/lib/format/money';

import { goalRemainingMinor, goalStatus, type GoalStatusKey, goalTimeLeft } from './goal-summary';

/** A card's live numbers, already narrowed to this goal by the caller. */
export interface GoalCardStats {
  gifts: number;
  latestGiftAt: string | null;
}

/** The chip colours follow the status so the same words never contradict the tint. */
const statusBadgeVariant: Record<GoalStatusKey, 'default' | 'secondary' | 'outline'> = {
  reached: 'default',
  ended: 'secondary',
  closing: 'secondary',
  open: 'outline',
};

/**
 * The deadline sentence, in content-file words: a countdown while it is open, the close day
 * once it has passed. Composed here instead of stringly-typing the words.
 */
function deadlineSentence(goal: DonationGoal, now: Date): string | null {
  const words = donatePage.goalTimeWords;
  if (!goal.deadline) return null;
  const left = goalTimeLeft(goal.deadline, now);
  if (left.kind === 'today') return words.today;
  if (left.kind === 'tomorrow') return words.tomorrow;
  const unit =
    left.kind === 'days'
      ? left.count === 1
        ? words.day
        : words.days
      : left.count === 1
        ? words.month
        : words.months;
  return `${words.prefix} ${left.count} ${unit}`;
}

/**
 * A giving goal with its progress, live numbers and a Give button. `stats` is optional so the
 * card degrades to progress-only wherever the caller does not fetch the ledger aggregates.
 * `now` must be `getCachedNow()` on a server: a bare `new Date()` inside the card would block
 * prerender. Tests omit it and fall back to the system clock.
 */
export function GoalCard({
  goal,
  stats,
  now = new Date(),
}: {
  goal: DonationGoal;
  stats?: GoalCardStats;
  now?: Date;
}) {
  const status = goalStatus(goal, now);
  const remaining = goalRemainingMinor(goal);
  const deadlineText = deadlineSentence(goal, now);

  return (
    <Card className="card-lift h-full">
      <CardHeader>
        <div
          aria-hidden="true"
          className="from-accent-600 to-accent-400 mb-3 h-0.5 w-10 rounded-full bg-gradient-to-r"
        />
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-primary-900 text-xl font-semibold">
            <Link href={`/donate/goals/${goal.id}`} className="hover:underline">
              {goal.title}
            </Link>
          </h3>
          <Badge variant={statusBadgeVariant[status]} aria-label={donatePage.goalStatus[status]}>
            {donatePage.goalStatus[status]}
          </Badge>
        </div>
        <p className="line-clamp-3 text-base text-neutral-600">{goal.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressBar
          label={goal.title}
          raised={goal.raisedMinor}
          target={goal.targetMinor}
          raisedLabel={formatNprCompact(goal.raisedMinor)}
          targetLabel={formatNprCompact(goal.targetMinor)}
        />
        {remaining > 0 ? (
          <p className="text-sm text-neutral-600">
            <span className="text-primary-900 font-medium">{formatNpr(remaining)}</span>{' '}
            {donatePage.goalStats.remaining}
          </p>
        ) : null}
        {stats ? (
          <p className="text-sm text-neutral-600">
            {donatePage.goalStats.gifts}:{' '}
            <span className="font-medium text-neutral-900">{stats.gifts}</span>
          </p>
        ) : null}
        {goal.deadline ? (
          <p className="text-sm text-neutral-600">
            {status === 'ended'
              ? `${donatePage.goalTimeWords.ended} ${formatDate(goal.deadline)}`
              : deadlineText}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto">
        <DonateLink
          href={`/donate/checkout?goal=${encodeURIComponent(goal.id)}`}
          aria-label={`${donatePage.goalDetail.give}: ${goal.title}`}
          className="h-10 w-full"
        >
          {donatePage.goalDetail.give}
        </DonateLink>
      </CardFooter>
    </Card>
  );
}
