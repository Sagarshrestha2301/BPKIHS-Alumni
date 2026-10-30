'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { accountPage } from '@/content/account';
import { useSession } from '@/features/auth/session-provider';
import { getApiClient } from '@/lib/api/client';

/** Ends the session on this device and sends the member back to the homepage. */
export function SignOutButton() {
  const router = useRouter();
  const { refresh: refreshSession } = useSession();
  const [busy, setBusy] = useState(false);

  async function onSignOut(): Promise<void> {
    setBusy(true);
    try {
      await getApiClient().logout();
    } finally {
      // The header keeps its own copy of the session; tell it before moving on.
      refreshSession();
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSignOut}
      disabled={busy}
      className="h-11 gap-2 px-5 text-base"
    >
      <LogOut aria-hidden="true" />
      {busy ? accountPage.signingOut : accountPage.signOut}
    </Button>
  );
}
