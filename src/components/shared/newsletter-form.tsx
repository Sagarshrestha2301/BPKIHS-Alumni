'use client';

import { CircleAlertIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address, for example name@example.com.');
      return;
    }
    setError(null);
    setDone(true);
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
        <Button type="submit" className="h-11 px-5">
          Subscribe
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
