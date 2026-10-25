'use client';

import { CircleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminSignIn } from '@/content/admin';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import type { ApiClient } from '@/lib/api/contract';

function SignInForm() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const session = await signIn({ email: email.trim(), password });
    if (session) {
      router.replace('/admin');
      router.refresh();
      return;
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
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
        <Input
          id="admin-password"
          type="password"
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
          {error.message || adminSignIn.error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="h-11 w-full">
        {submitting ? adminSignIn.submitting : adminSignIn.submit}
      </Button>
    </form>
  );
}

export function AdminSignIn({ client }: { client?: ApiClient }) {
  return (
    <AuthProvider client={client}>
      <SignInForm />
    </AuthProvider>
  );
}
