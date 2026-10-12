import { DonateLink } from '@/components/shared/donate-link';
import { ProgressBar } from '@/components/shared/progress-bar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { DonationGoal } from '@/lib/api/types';
import { formatDate } from '@/lib/format/dates';
import { formatNprCompact } from '@/lib/format/money';

/** A giving goal with its progress and a Give button. Reused on /donate in Phase 6. */
export function GoalCard({ goal }: { goal: DonationGoal }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <h3 className="font-heading text-primary-900 text-xl font-semibold">{goal.title}</h3>
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
        {goal.deadline ? (
          <p className="text-sm text-neutral-600">Closes {formatDate(goal.deadline)}</p>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto">
        <DonateLink
          href="/donate"
          aria-label={`Give to this goal: ${goal.title}`}
          className="h-10 w-full"
        >
          Give to this goal
        </DonateLink>
      </CardFooter>
    </Card>
  );
}
