'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { adminActions } from '@/content/admin';
import { useSession } from '@/features/auth/session-provider';
import { getApiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { refresh: refreshSession } = useSession();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await getApiClient().logout();
    } finally {
      refreshSession();
      router.replace('/admin/sign-in');
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={signOut} disabled={busy} className={cn(className)}>
      {busy ? adminActions.signingOut : adminActions.signOut}
    </Button>
  );
}
