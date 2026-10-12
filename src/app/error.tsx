'use client';

import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { ErrorState } from '@/components/shared/error-state';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-xl">
        <ErrorState
          title="Something went wrong"
          description="We could not show this page. Please try again. If it keeps happening, contact support."
          onRetry={reset}
        />
        <p className="mt-6 text-center text-sm text-neutral-600">
          Still stuck?{' '}
          <Link
            href="/support"
            className="text-primary-700 font-medium underline underline-offset-4"
          >
            Contact support
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
