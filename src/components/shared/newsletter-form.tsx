'use client';

import { CircleAlertIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm({ client }: { client?: ApiClient } = {}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setError('Enter a valid email address, for example name@example.com.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await (client ?? getApiClient()).subscribeNewsletter({ email: address, interests: [] });
      setDone(true);
    } catch (caught) {
      setError(
        isApiError(caught) ? caught.message : 'We could not subscribe you. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="text-primary-900 font-medium">
        Thank you. You are on the list. (Demo only until the backend is connected.)
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Label htmlFor="newsletter-email" className="text-primary-900 mb-2 block font-medium">
        Email address
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="h-11 bg-white sm:max-w-sm"
        />
        <Button type="submit" disabled={submitting} className="h-11 px-5">
          {submitting ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </div>
      {error ? (
        <p id="newsletter-error" className="text-danger-600 mt-2 flex items-center gap-1.5 text-sm">
          <CircleAlertIcon aria-hidden="true" className="size-4" />
          {error}
        </p>
      ) : null}
    </form>
  );
}
