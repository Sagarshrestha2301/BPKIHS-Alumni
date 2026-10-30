'use client';

import { type FormEvent, useState } from 'react';

import { BotCheck } from '@/components/shared/bot-check';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supportPage } from '@/content/support';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { contactMessageSchema } from '@/lib/api/schemas';

const copy = supportPage.contactForm;
const inputClass = 'h-11 bg-white';

type FieldName = 'name' | 'email' | 'organisation' | 'subject' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;

/** General and institutional enquiries. No account and no sign-in: anyone may write. */
export function ContactForm() {
  const [values, setValues] = useState({
    name: '',
    email: '',
    organisation: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [botToken, setBotToken] = useState('');
  const [botReset, setBotReset] = useState(0);

  function update(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const parsed = contactMessageSchema.safeParse({
      ...values,
      organisation: values.organisation.trim() || undefined,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && field in values) {
          next[field as FieldName] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setError(null);
    setStatus('submitting');
    try {
      const result = await getApiClient().submitContactMessage(parsed.data, { botToken });
      setTicketId(result.ticketId);
      setStatus('done');
    } catch (caught) {
      setStatus('idle');
      setError(isApiError(caught) ? caught.message : copy.error);
      setBotToken('');
      setBotReset((value) => value + 1);
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="border-success-600/30 bg-success-600/5 rounded-xl border p-6">
        <h3 className="font-heading text-primary-900 text-lg font-semibold">{copy.successTitle}</h3>
        <p className="mt-2 text-sm text-neutral-600">{copy.successBody}</p>
        {ticketId ? (
          <p className="mt-3 text-sm text-neutral-600">
            {supportPage.success.reference}:{' '}
            <span className="font-mono text-neutral-900">{ticketId}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={copy.fields.name} error={errors.name} required>
          {(control) => (
            <Input
              {...control}
              autoComplete="name"
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>
        <FormField label={copy.fields.email} error={errors.email} required>
          {(control) => (
            <Input
              {...control}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => update('email', event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>
      </div>
      <FormField label={copy.fields.organisation} error={errors.organisation}>
        {(control) => (
          <Input
            {...control}
            autoComplete="organization"
            value={values.organisation}
            onChange={(event) => update('organisation', event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>
      <FormField label={copy.fields.subject} error={errors.subject} required>
        {(control) => (
          <Input
            {...control}
            value={values.subject}
            onChange={(event) => update('subject', event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>
      <FormField label={copy.fields.message} error={errors.message} required>
        {(control) => (
          <Textarea
            {...control}
            rows={6}
            value={values.message}
            onChange={(event) => update('message', event.target.value)}
            className="min-h-36 bg-white"
          />
        )}
      </FormField>

      {error ? (
        <p role="alert" className="text-danger-600 text-sm font-medium">
          {error}
        </p>
      ) : null}

      <BotCheck onToken={setBotToken} resetKey={botReset} />

      <Button
        type="submit"
        variant="outline"
        disabled={status === 'submitting'}
        className="h-11 justify-self-start px-6 text-base font-semibold"
      >
        {status === 'submitting' ? copy.submitting : copy.button}
      </Button>
    </form>
  );
}
