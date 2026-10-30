'use client';

import { MailWarning } from 'lucide-react';
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
 * The code screen: the one step between an account and a reviewable profile. It renders
 * nothing once the address is confirmed, so a verified member never sees it again.
 * Verifying also signs the member in, so the page is refreshed rather than patched in place.
 */
export function VerificationCard({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'verify' | 'resend' | null>(null);
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

  if (verified) return null;

  return (
    <form
      onSubmit={onVerify}
      noValidate
      className="border-warning-600/30 bg-warning-600/5 rounded-xl border p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-warning-600/10 text-warning-600 flex size-9 shrink-0 items-center justify-center rounded-lg"
        >
          <MailWarning className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-primary-900 text-base font-semibold">
            {accountPage.verification.cardTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{accountPage.verification.unverifiedHelp}</p>
        </div>
      </div>

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
          {busy === 'verify' ? accountPage.verification.verifying : accountPage.verification.verify}
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
          {busy === 'resend' ? accountPage.verification.resending : accountPage.verification.resend}
          {secondsLeft > 0 ? ` (${secondsLeft}s)` : ''}
        </Button>
      </div>
    </form>
  );
}
