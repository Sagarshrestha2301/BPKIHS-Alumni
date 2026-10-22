'use client';

import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { newsletterPage } from '@/content/community';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { newsletterPrefsSchema, newsletterSubscribeSchema } from '@/lib/api/schemas';
import { NEWSLETTER_INTERESTS, type NewsletterInterest } from '@/lib/constants/domain';

const inputClass = 'h-11 bg-white';

export function NewsletterSignup({ client }: { client?: ApiClient }) {
  const copy = newsletterPage;
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<NewsletterInterest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = newsletterSubscribeSchema.safeParse({ email, interests });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.error);
      return;
    }
    setError(null);
    setStatus('submitting');
    try {
      await (client ?? getApiClient()).subscribeNewsletter(parsed.data);
      setStatus('done');
    } catch (caught) {
      setStatus('idle');
      setError(isApiError(caught) ? caught.message : copy.error);
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="text-primary-900 font-medium">
        {copy.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={copy.emailLabel} error={error ?? undefined} required>
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

      <fieldset>
        <legend className="text-primary-900 mb-3 text-base font-semibold">
          {copy.interestsLabel}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {NEWSLETTER_INTERESTS.map((interest) => (
            <label
              key={interest}
              className="flex min-h-11 items-center gap-3 rounded-lg border border-neutral-300 px-3"
            >
              <Checkbox
                checked={interests.includes(interest)}
                onCheckedChange={(checked) =>
                  setInterests((current) =>
                    checked === true
                      ? [...current, interest]
                      : current.filter((item) => item !== interest),
                  )
                }
              />
              <span className="text-sm text-neutral-900">{copy.interests[interest]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="h-11 justify-self-start px-6 text-base font-semibold"
      >
        {status === 'submitting' ? copy.subscribing : copy.subscribe}
      </Button>
    </form>
  );
}

export function NewsletterPreferences({ client }: { client?: ApiClient }) {
  const copy = newsletterPage;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = newsletterPrefsSchema.safeParse({ email, optIn: false });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.error);
      return;
    }
    setError(null);
    setStatus('submitting');
    try {
      await (client ?? getApiClient()).updateNewsletterPrefs(parsed.data);
      setStatus('done');
    } catch (caught) {
      setStatus('idle');
      setError(isApiError(caught) ? caught.message : copy.error);
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="text-primary-900 font-medium">
        {copy.unsubscribed}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField label={copy.emailLabel} error={error ?? undefined} required>
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
      <Button
        type="submit"
        variant="outline"
        disabled={status === 'submitting'}
        className="h-11 justify-self-start px-5"
      >
        {status === 'submitting' ? copy.unsubscribing : copy.unsubscribe}
      </Button>
    </form>
  );
}
