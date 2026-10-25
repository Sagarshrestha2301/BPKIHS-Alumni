'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { adminActions } from '@/content/admin';
import { getApiClient } from '@/lib/api/client';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await getApiClient().logout();
    } finally {
      router.replace('/admin/sign-in');
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={signOut} disabled={busy}>
      {busy ? 'Signing out…' : adminActions.signOut}
    </Button>
  );
}
