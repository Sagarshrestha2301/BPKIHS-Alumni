'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { resetPasswordPage } from '@/content/account';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { resetPasswordSchema } from '@/lib/api/schemas';

const inputClass = 'h-11 bg-white';

export function ResetPasswordForm({ token }: { token: string }) {
  const copy = resetPasswordPage;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) {
      const next: { password?: string; confirmPassword?: string } = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'password' || field === 'confirmPassword') next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setError(null);
    setBusy(true);
    try {
      await getApiClient().resetPassword(parsed.data);
      setDone(true);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="grid gap-5">
        <p
          role="status"
          className="border-primary-100 bg-primary-100/50 text-primary-900 rounded-lg border p-4 text-sm"
        >
          {copy.success}
        </p>
        <Link href="/sign-in" className="text-primary-700 text-sm underline underline-offset-4">
          {copy.signIn}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={copy.passwordLabel} hint={copy.hint} error={errors.password} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      <FormField label={copy.confirmLabel} error={errors.confirmPassword} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      {error ? (
        <p
          role="alert"
          className="text-danger-600 border-danger-600/30 bg-danger-600/5 rounded-lg border p-3 text-sm font-medium"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy} className="h-11 px-5 text-base">
          {busy ? copy.submitting : copy.submit}
        </Button>
        <Link
          href="/forgot-password"
          className="text-primary-700 text-sm underline underline-offset-4"
        >
          {copy.requestNew}
        </Link>
      </div>
    </form>
  );
}
