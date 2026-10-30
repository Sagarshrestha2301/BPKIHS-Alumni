'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordPage } from '@/content/account';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { forgotPasswordSchema } from '@/lib/api/schemas';

/**
 * The reply is the same whether or not the address exists, so this form cannot be used to find
 * out who has an account.
 */
export function ForgotPasswordForm() {
  const copy = forgotPasswordPage;
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;

    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }

    setFieldError(undefined);
    setError(null);
    setBusy(true);
    try {
      await getApiClient().requestPasswordReset(parsed.data);
      setSent(true);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="grid gap-5">
        <p
          role="status"
          className="border-primary-100 bg-primary-100/50 text-primary-900 rounded-lg border p-4 text-sm"
        >
          {copy.success}
        </p>
        <Link href="/sign-in" className="text-primary-700 text-sm underline underline-offset-4">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={copy.emailLabel} error={fieldError} required>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldError(undefined);
            }}
            className="h-11 bg-white"
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
        <Link href="/sign-in" className="text-primary-700 text-sm underline underline-offset-4">
          {copy.back}
        </Link>
      </div>
    </form>
  );
}
