'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { adminActions } from '@/content/admin';
import { isApiError } from '@/lib/api/errors';

/**
 * One mutation at a time per widget, so a double click cannot approve twice. The server is
 * idempotent anyway, but the button should reflect what is happening.
 */
export function useAdminAction() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, action: () => Promise<unknown>): Promise<boolean> => {
      if (pending) return false;
      setPending(key);
      setError(null);
      try {
        await action();
        router.refresh();
        return true;
      } catch (caught) {
        setError(isApiError(caught) ? caught.message : adminActions.failed);
        return false;
      } finally {
        setPending(null);
      }
    },
    [pending, router],
  );

  return { pending, error, run, setError };
}
