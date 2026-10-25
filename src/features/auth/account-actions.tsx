'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accountPage } from '@/content/account';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { REGISTRATION_CODE_RESEND_SECONDS } from '@/lib/constants/domain';

const CODE_PATTERN = /^\d{4,8}$/;

/**
 * The two things a member can do here: confirm the address we emailed, and sign out.
 * Verifying also signs them in, so the page is refreshed rather than patched in place.
 */
export function AccountActions({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'verify' | 'resend' | 'signout' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function onVerify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    const otp = code.trim();
    if (!CODE_PATTERN.test(otp)) {
      setError(accountPage.verification.failed);
      return;
    }

    setBusy('verify');
    setError(null);
    setMessage(null);
    try {
      await getApiClient().verifyRegistration({ email, otp });
      router.refresh();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : accountPage.verification.failed);
      setBusy(null);
    }
  }

  async function onResend(): Promise<void> {
    if (busy || secondsLeft > 0) return;
    setBusy('resend');
    setError(null);
    setMessage(null);
    setSecondsLeft(REGISTRATION_CODE_RESEND_SECONDS);
    try {
      await getApiClient().resendRegistrationCode({ email });
      setMessage(accountPage.verification.sent);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : accountPage.verification.failed);
    } finally {
      setBusy(null);
    }
  }

  async function onSignOut(): Promise<void> {
    setBusy('signout');
    try {
      await getApiClient().logout();
    } finally {
      router.replace('/');
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      {verified ? null : (
        <form
          onSubmit={onVerify}
          noValidate
          className="rounded-lg border border-neutral-300 bg-neutral-100/60 p-4"
        >
          <p className="text-primary-900 text-base font-semibold">
            {accountPage.verification.unverified}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{accountPage.verification.unverifiedHelp}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <FormField label={accountPage.verification.codeLabel} error={error ?? undefined}>
              {(control) => (
                <Input
                  {...control}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  className="h-11 bg-white tracking-[0.3em]"
                />
              )}
            </FormField>
            <Button
              type="submit"
              disabled={busy !== null}
              className="mt-6 h-11 px-5 text-base font-semibold"
            >
              {busy === 'verify'
                ? accountPage.verification.verifying
                : accountPage.verification.verify}
            </Button>
          </div>

          {message ? (
            <p role="status" className="text-primary-900 mt-3 text-sm">
              {message}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResend}
              disabled={busy !== null || secondsLeft > 0}
            >
              {busy === 'resend'
                ? accountPage.verification.resending
                : accountPage.verification.resend}
              {secondsLeft > 0 ? ` (${secondsLeft}s)` : ''}
            </Button>
          </div>
        </form>
      )}

      <div>
        <Button variant="outline" onClick={onSignOut} disabled={busy === 'signout'}>
          {busy === 'signout' ? accountPage.signingOut : accountPage.signOut}
        </Button>
      </div>
    </div>
  );
}
