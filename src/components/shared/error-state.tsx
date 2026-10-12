'use client';

import { TriangleAlertIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-xl border border-neutral-300 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <TriangleAlertIcon aria-hidden="true" className="text-danger-600 mb-4 size-8" />
      <p className="text-primary-900 text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-neutral-600">{description}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
