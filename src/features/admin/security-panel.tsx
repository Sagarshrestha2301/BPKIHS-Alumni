'use client';

import { CircleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { adminSecurity as copy } from '@/content/admin';
import {
  AdminAuthError,
  confirmTwoFactor,
  disableTwoFactor,
  enableTwoFactor,
  totpAccount,
  totpSecret,
  type TwoFactorEnrolment,
} from '@/features/admin/admin-auth';

/**
 * Enrolment and removal of the administrator's authenticator app.
 *
 * The secret and the backup codes are shown exactly once, in this component's memory. A
 * refresh before confirmation loses them and the unverified secret is replaced on the next
 * attempt; after confirmation only a code can reproduce access, so the page tells the admin
 * to store the codes before continuing.
 */
export function SecurityPanel({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [enrolment, setEnrolment] = useState<TwoFactorEnrolment | null>(null);
  const [code, setCode] = useState('');
  const [justEnabled, setJustEnabled] = useState(false);

  function fail(caught: unknown): void {
    setError(caught instanceof AdminAuthError ? caught.message : copy.error);
  }

  async function onStart(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const next = await enableTwoFactor(password);
      if (!totpSecret(next.totpURI)) {
        setError(copy.missingSecret);
        return;
      }
      setEnrolment(next);
      setPassword('');
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy || !enrolment) return;

    setBusy(true);
    setError(null);
    try {
      await confirmTwoFactor(code.trim());
      setJustEnabled(true);
      setEnrolment(null);
      setCode('');
      router.refresh();
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(false);
    }
  }

  async function onDisable(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      await disableTwoFactor(password);
      setPassword('');
      setJustEnabled(false);
      router.refresh();
    } catch (caught) {
      fail(caught);
    } finally {
      setBusy(false);
    }
  }

  const secret = enrolment ? totpSecret(enrolment.totpURI) : '';
  const account = enrolment ? totpAccount(enrolment.totpURI) : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-600">{copy.statusLabel}</p>
          <p className="font-heading text-primary-900 text-xl font-semibold">
            {enabled ? copy.enabled : copy.disabled}
          </p>
        </div>
        <span
          className={
            enabled
              ? 'bg-primary-100 text-primary-900 rounded-full px-3 py-1 text-sm font-medium'
              : 'rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700'
          }
        >
          {enabled ? copy.enabled : copy.disabled}
        </span>
      </div>

      <p className="text-sm text-neutral-600">{enabled ? copy.enabledHelp : copy.disabledHelp}</p>

      {error ? (
        <p role="alert" className="text-danger-600 flex items-center gap-1.5 text-sm">
          <CircleAlertIcon aria-hidden="true" className="size-4" />
          {error}
        </p>
      ) : null}

      {enabled ? (
        <form
          onSubmit={onDisable}
          noValidate
          className="space-y-3 border-t border-neutral-300 pt-6"
        >
          {justEnabled ? (
            <p role="status" className="text-primary-900 text-sm font-medium">
              {copy.done}
            </p>
          ) : null}
          <p className="text-sm text-neutral-600">{copy.disableHelp}</p>
          <div className="space-y-1.5">
            <Label htmlFor="security-disable-password">{copy.passwordLabel}</Label>
            <PasswordInput
              id="security-disable-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 bg-white"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={busy || password === ''}
            className="h-11"
          >
            {busy ? copy.working : copy.disableSubmit}
          </Button>
        </form>
      ) : enrolment ? (
        <div className="space-y-6 border-t border-neutral-300 pt-6">
          <section aria-labelledby="security-scan">
            <h2 id="security-scan" className="font-heading text-primary-900 text-lg font-semibold">
              {copy.scanTitle}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{copy.scanHelp}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-neutral-600">{copy.secretLabel}</dt>
                <dd>
                  <code className="mt-1 block rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm break-all text-neutral-900">
                    {secret}
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-600">{copy.accountLabel}</dt>
                <dd className="break-all text-neutral-900">{account}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="security-backup">
            <h2
              id="security-backup"
              className="font-heading text-primary-900 text-lg font-semibold"
            >
              {copy.backupTitle}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{copy.backupHelp}</p>
            <ul
              aria-label={copy.backupCodesLabel}
              className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-3"
            >
              {enrolment.backupCodes.map((backupCode) => (
                <li key={backupCode} className="rounded-lg border border-neutral-300 px-3 py-2">
                  {backupCode}
                </li>
              ))}
            </ul>
          </section>

          <form
            onSubmit={onConfirm}
            noValidate
            className="space-y-3 border-t border-neutral-300 pt-6"
          >
            <div>
              <h2 className="font-heading text-primary-900 text-lg font-semibold">
                {copy.confirmTitle}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">{copy.confirmHelp}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="security-confirm-code">{copy.codeLabel}</Label>
              <Input
                id="security-confirm-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                className="h-11 bg-white"
              />
            </div>
            <Button type="submit" disabled={busy || code.trim() === ''} className="h-11">
              {busy ? copy.working : copy.confirm}
            </Button>
          </form>
        </div>
      ) : (
        <form onSubmit={onStart} noValidate className="space-y-3 border-t border-neutral-300 pt-6">
          <p className="text-sm text-neutral-600">{copy.setUpHelp}</p>
          <div className="space-y-1.5">
            <Label htmlFor="security-password">{copy.passwordLabel}</Label>
            <PasswordInput
              id="security-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 bg-white"
            />
          </div>
          <Button type="submit" disabled={busy || password === ''} className="h-11">
            {busy ? copy.working : copy.setUp}
          </Button>
        </form>
      )}
    </div>
  );
}
