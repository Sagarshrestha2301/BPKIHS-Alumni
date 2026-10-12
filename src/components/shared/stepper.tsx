import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type Step = { id: string; label: string };

type StepperProps = {
  steps: readonly Step[];
  currentIndex: number;
  className?: string;
};

export function Stepper({ steps, currentIndex, className }: StepperProps) {
  const total = steps.length;
  return (
    <nav aria-label="Progress" className={className}>
      <p className="text-sm font-medium text-neutral-600 md:hidden">
        Step {currentIndex + 1} of {total}: {steps[currentIndex]?.label}
      </p>
      <ol className="hidden items-center gap-4 md:flex">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <li
              key={step.id}
              aria-current={current ? 'step' : undefined}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border text-sm font-semibold',
                  done && 'border-success-600 bg-success-600 text-white',
                  current && 'border-primary-700 bg-primary-700 text-white',
                  !done && !current && 'border-neutral-300 bg-white text-neutral-600',
                )}
              >
                {done ? <CheckIcon aria-hidden="true" className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm',
                  current ? 'text-primary-900 font-semibold' : 'text-neutral-600',
                )}
              >
                {step.label}
                {done ? <span className="sr-only"> (completed)</span> : null}
              </span>
              {i < total - 1 ? (
                <span aria-hidden="true" className="h-px w-8 bg-neutral-300" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
