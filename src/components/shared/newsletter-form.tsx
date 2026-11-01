'use client';

import { CircleAlertIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { BotCheck } from '@/components/shared/bot-check';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { newsletterPage } from '@/content/community';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm({ client }: { client?: ApiClient } = {}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);
  // The footer sits on every page, so Turnstile is mounted on first interaction rather than
  // loading a third-party script for every visitor who never touches the newsletter box.
  const [botActive, setBotActive] = useState(false);

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
      const result = await (client ?? getApiClient()).subscribeNewsletter(
        { email: address, interests: [] },
        { botToken },
      );
      // The address is held as pending either way. What the visitor must not be told is
      // "check your inbox" when the provider refused the message.
      if (!result.confirmationEmailSent) {
        setError(newsletterPage.emailFailed);
        setBotToken('');
        setBotReset((value) => value + 1);
        return;
      }
      setDone(true);
    } catch (caught) {
      setError(
        isApiError(caught) ? caught.message : 'We could not subscribe you. Please try again.',
      );
      setBotToken('');
      setBotReset((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="text-primary-900 font-medium">
        {newsletterPage.success}
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
          onFocus={() => setBotActive(true)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="focus-visible:border-primary-700 h-11 border-neutral-300/90 bg-white text-sm shadow-xs sm:max-w-sm"
        />
        <Button
          type="submit"
          disabled={submitting}
          className="btn-press h-11 px-6 font-semibold shadow-xs"
        >
          {submitting ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </div>
      {botActive ? (
        <div className="mt-3">
          <BotCheck onToken={setBotToken} resetKey={botReset} />
        </div>
      ) : null}

      {error ? (
        <p
          id="newsletter-error"
          role="alert"
          className="text-danger-600 mt-2 flex items-center gap-1.5 text-sm"
        >
          <CircleAlertIcon aria-hidden="true" className="size-4" />
          {error}
        </p>
      ) : null}
    </form>
  );
}
