'use client';

import { type FormEvent, useState } from 'react';

import { BotCheck } from '@/components/shared/bot-check';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { eventDetailPage } from '@/content/events';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { rsvpSchema } from '@/lib/api/schemas';

const inputClass = 'h-11 bg-white';

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'partySize', string>>;

export function RsvpForm({
  eventId,
  capacity,
  rsvpCount,
  client,
}: {
  eventId: string;
  capacity?: number;
  rsvpCount: number;
  client?: ApiClient;
}) {
  const copy = eventDetailPage;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'waitlisted'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status === 'submitting') return;

    const parsed = rsvpSchema.safeParse({
      name,
      email,
      phone,
      partySize: Number(partySize),
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'name' || field === 'email' || field === 'phone' || field === 'partySize') {
          next[field] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setMessage(null);
    setStatus('submitting');
    try {
      await (client ?? getApiClient()).submitRsvp(eventId, parsed.data, { botToken });
      const waitlisted = capacity !== undefined && rsvpCount + parsed.data.partySize > capacity;
      setStatus(waitlisted ? 'waitlisted' : 'done');
    } catch (error) {
      setStatus('idle');
      if (isApiError(error)) {
        if (error.fieldErrors?.email) setErrors({ email: error.fieldErrors.email });
        else setMessage(error.message);
      } else {
        setMessage(copy.error);
      }
      setBotToken('');
      setBotReset((value) => value + 1);
    }
  }

  if (status === 'done' || status === 'waitlisted') {
    return (
      <div role="status" className="border-success-600/30 bg-success-600/5 rounded-xl border p-6">
        <p className="text-primary-900 text-lg font-semibold">
          {status === 'done' ? copy.success : copy.waitlist}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-primary-900 text-2xl font-semibold">{copy.rsvpTitle}</h2>
      <p className="mt-2 text-sm text-neutral-600">{copy.rsvpIntro}</p>

      <div className="mt-5 grid gap-4">
        <FormField label={copy.fields.name} error={errors.name} required>
          {(control) => (
            <Input
              {...control}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.fields.email} error={errors.email} required>
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.fields.phone} error={errors.phone}>
          {(control) => (
            <Input
              {...control}
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField
          label={copy.fields.partySize}
          hint={copy.partyHint}
          error={errors.partySize}
          required
        >
          {(control) => (
            <Input
              {...control}
              name="partySize"
              type="number"
              inputMode="numeric"
              min={1}
              max={6}
              step={1}
              value={partySize}
              onChange={(event) => setPartySize(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>
      </div>

      {message ? (
        <p role="alert" className="text-danger-600 mt-4 text-sm font-medium">
          {message}
        </p>
      ) : null}

      <div className="mt-5">
        <BotCheck onToken={setBotToken} resetKey={botReset} />
      </div>

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-5 h-11 px-6 text-base font-semibold"
      >
        {status === 'submitting' ? copy.buttons.submitting : copy.buttons.rsvp}
      </Button>
    </form>
  );
}
