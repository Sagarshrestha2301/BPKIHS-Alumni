'use client';

import { CircleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { adminSignIn } from '@/content/admin';
import {
  AdminAuthError,
  adminSignIn as startSignIn,
  verifyAdminBackupCode,
  verifyAdminTotp,
} from '@/features/admin/admin-auth';

/**
 * Password first, then the authenticator code when the account has two-factor on. The
 * password response carries a short-lived challenge cookie rather than a session, so a
 * half-finished sign-in cannot open the dashboard.
 */
export function AdminSignIn() {
  const router = useRouter();
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function finish(): void {
    router.replace('/admin');
    router.refresh();
  }

  async function onPassword(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await startSignIn({ email: email.trim(), password });
      if (result.twoFactorRequired) {
        setPassword('');
        setStep('code');
      } else {
        finish();
      }
    } catch (caught) {
      setError(caught instanceof AdminAuthError ? caught.message : adminSignIn.error);
    } finally {
      setSubmitting(false);
    }
  }

  async function onCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      if (backupCode) {
        await verifyAdminBackupCode(code.trim());
      } else {
        await verifyAdminTotp(code.trim());
      }
      finish();
    } catch (caught) {
      setError(caught instanceof AdminAuthError ? caught.message : adminSignIn.codeError);
    } finally {
      setSubmitting(false);
    }
  }

  function usePasswordStep(): void {
    setStep('password');
    setCode('');
    setBackupCode(false);
    setError(null);
  }

  if (step === 'code') {
    return (
      <form onSubmit={onCode} noValidate className="space-y-4">
        <div>
          <h2 className="font-heading text-primary-900 text-lg font-semibold">
            {adminSignIn.codeTitle}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {backupCode ? adminSignIn.backupHelp : adminSignIn.codeHelp}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-code">
            {backupCode ? adminSignIn.backupLabel : adminSignIn.codeLabel}
          </Label>
          <Input
            id="admin-code"
            autoFocus
            autoComplete="one-time-code"
            inputMode={backupCode ? 'text' : 'numeric'}
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            className="h-11 bg-white"
          />
        </div>

        {error ? (
          <p role="alert" className="text-danger-600 flex items-center gap-1.5 text-sm">
            <CircleAlertIcon aria-hidden="true" className="size-4" />
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting || code.trim() === ''} className="h-11 w-full">
          {submitting ? adminSignIn.verifying : adminSignIn.verify}
        </Button>

        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setBackupCode((current) => !current);
              setCode('');
              setError(null);
            }}
            className="text-primary-700 underline underline-offset-4"
          >
            {backupCode ? adminSignIn.useAuthenticator : adminSignIn.useBackup}
          </button>
          <button
            type="button"
            onClick={usePasswordStep}
            className="text-neutral-600 underline underline-offset-4"
          >
            {adminSignIn.backToPassword}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onPassword} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="admin-email">{adminSignIn.emailLabel}</Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="h-11 bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-password">{adminSignIn.passwordLabel}</Label>
        <PasswordInput
          id="admin-password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="h-11 bg-white"
        />
      </div>

      {error ? (
        <p role="alert" className="text-danger-600 flex items-center gap-1.5 text-sm">
          <CircleAlertIcon aria-hidden="true" className="size-4" />
          {error || adminSignIn.error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-11 w-full">
        {submitting ? adminSignIn.submitting : adminSignIn.submit}
      </Button>
    </form>
  );
}
