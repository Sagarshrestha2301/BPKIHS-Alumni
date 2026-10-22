'use client';

import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supportPage } from '@/content/support';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { helpdeskSchema } from '@/lib/api/schemas';
import { HELPDESK_TOPICS, type HelpdeskTopic } from '@/lib/constants/domain';

const inputClass = 'h-11 bg-white';
const selectClass =
  'border-neutral-500 focus-visible:border-primary-700 h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-primary-700/30';

type FieldName = 'topic' | 'name' | 'email' | 'subject' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;

export function HelpdeskForm({ client }: { client?: ApiClient }) {
  const copy = supportPage;
  const [topic, setTopic] = useState<HelpdeskTopic>('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = helpdeskSchema.safeParse({ topic, name, email, subject, message });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'topic' ||
          field === 'name' ||
          field === 'email' ||
          field === 'subject' ||
          field === 'message'
        ) {
          next[field] ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setError(null);
    setStatus('submitting');
    try {
      const result = await (client ?? getApiClient()).submitSupportTicket(parsed.data);
      setTicketId(result.ticketId);
      setStatus('done');
    } catch (caught) {
      setStatus('idle');
      setError(isApiError(caught) ? caught.message : copy.error);
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="border-success-600/30 bg-success-600/5 rounded-xl border p-6">
        <h2 className="font-heading text-primary-900 text-xl font-semibold">
          {copy.success.title}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{copy.success.body}</p>
        {ticketId ? (
          <p className="mt-3 text-sm text-neutral-600">
            {copy.success.reference}: <span className="font-mono text-neutral-900">{ticketId}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <FormField label={copy.fields.topic} error={errors.topic} required>
        {(control) => (
          <select
            {...control}
            value={topic}
            onChange={(event) => setTopic(event.target.value as HelpdeskTopic)}
            className={selectClass}
          >
            {HELPDESK_TOPICS.map((value) => (
              <option key={value} value={value}>
                {copy.topics[value]}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={copy.fields.name} error={errors.name} required>
          {(control) => (
            <Input
              {...control}
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
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>
      </div>

      <FormField label={copy.fields.subject} error={errors.subject} required>
        {(control) => (
          <Input
            {...control}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          />
        )}
      </FormField>

      <FormField label={copy.fields.message} error={errors.message} required>
        {(control) => (
          <Textarea
            {...control}
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-36 bg-white"
          />
        )}
      </FormField>

      {error ? (
        <p role="alert" className="text-danger-600 text-sm font-medium">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="h-11 justify-self-start px-6 text-base font-semibold"
      >
        {status === 'submitting' ? copy.submitting : copy.button}
      </Button>
    </form>
  );
}
