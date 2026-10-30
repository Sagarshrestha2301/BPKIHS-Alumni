'use client';

import { CircleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { signInPage } from '@/content/account';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { useSession } from '@/features/auth/session-provider';
import type { ApiClient } from '@/lib/api/contract';
import { loginSchema } from '@/lib/api/schemas';

const inputClass = 'h-11 bg-white';

function SignInFields({ next }: { next?: string | null }) {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const { refresh: refreshSession } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;

    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const next: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') next[field] ??= issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    const session = await signIn(parsed.data);
    if (session) {
      // The header keeps its own copy of the session; tell it before moving on.
      refreshSession();
      // Back to the page that asked for a sign-in, or the account page by default.
      router.replace(next ?? '/account');
      router.refresh();
      return;
    }
    setSubmitting(false);
  }

  const message = error?.message ?? (error ? signInPage.error : null);
  const unverified = Boolean(error && /verif/i.test(error.message));

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField
        label={signInPage.fields.email.label}
        hint={signInPage.fields.email.hint}
        error={fieldErrors.email}
        required
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      <FormField label={signInPage.fields.password.label} error={fieldErrors.password} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      {message ? (
        <p
          role="alert"
          className="text-danger-600 border-danger-600/30 bg-danger-600/5 flex items-start gap-1.5 rounded-lg border p-3 text-sm font-medium"
        >
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {message}
            {unverified ? ` ${signInPage.unverified}` : null}
          </span>
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-11 px-6 text-base font-semibold">
        {submitting ? signInPage.buttons.submitting : signInPage.buttons.submit}
      </Button>
    </form>
  );
}

export function SignInForm({ client, next }: { client?: ApiClient; next?: string | null }) {
  return (
    <AuthProvider client={client}>
      <SignInFields next={next} />
    </AuthProvider>
  );
}
