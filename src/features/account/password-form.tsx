'use client';

import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { accountPage } from '@/content/account';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { changePasswordSchema } from '@/lib/api/schemas';

const inputClass = 'h-11 bg-white';

type FieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

/** Changing a password requires the current one, then signs other devices out. */
export function PasswordForm() {
  const copy = accountPage.password;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'currentPassword' || field === 'newPassword' || field === 'confirmPassword') {
          next[field] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await getApiClient().changePassword(parsed.data);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(copy.success);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={copy.current} error={errors.currentPassword} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      <FormField label={copy.next} hint={copy.hint} error={errors.newPassword} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      <FormField label={copy.confirm} error={errors.confirmPassword} required>
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

      {message ? (
        <p
          role="status"
          className="border-primary-100 bg-primary-100/50 text-primary-900 rounded-lg border p-3 text-sm"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-danger-600 border-danger-600/30 bg-danger-600/5 rounded-lg border p-3 text-sm font-medium"
        >
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={busy} className="h-11 px-5 text-base">
          {busy ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  );
}
