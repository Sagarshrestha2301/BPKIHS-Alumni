'use client';

import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { communityPage } from '@/content/community';
import { POST_TYPE_LABELS } from '@/features/community/post-card';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { memberPostSchema } from '@/lib/api/schemas';
import { MEMBER_POST_TYPES, type MemberPostType } from '@/lib/constants/domain';

const inputClass = 'h-11 bg-white';
const selectClass =
  'border-neutral-500 focus-visible:border-primary-700 h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-primary-700/30';

type FieldName = 'type' | 'title' | 'body' | 'authorName' | 'authorEmail';
type FieldErrors = Partial<Record<FieldName, string>>;

export function SharePostForm({ client }: { client?: ApiClient }) {
  const copy = communityPage.share;
  const [type, setType] = useState<MemberPostType>('story');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = memberPostSchema.safeParse({
      type,
      title,
      body,
      authorName,
      authorEmail,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'type' ||
          field === 'title' ||
          field === 'body' ||
          field === 'authorName' ||
          field === 'authorEmail'
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
      await (client ?? getApiClient()).submitPost(parsed.data);
      setStatus('done');
    } catch (caught) {
      setStatus('idle');
      setError(isApiError(caught) ? caught.message : copy.error);
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="border-success-600/30 bg-success-600/5 rounded-xl border p-6">
        <p className="text-primary-900 font-medium">{copy.success}</p>
      </div>
    );
  }

  return (
    <details className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
      <summary className="text-primary-900 cursor-pointer text-lg font-semibold">
        {copy.summary}
      </summary>
      <p className="mt-3 text-sm text-neutral-600">{copy.description}</p>
      <form onSubmit={onSubmit} noValidate className="mt-5 grid gap-4">
        <FormField label={copy.fields.type} error={errors.type} required>
          {(control) => (
            <select
              {...control}
              value={type}
              onChange={(event) => setType(event.target.value as MemberPostType)}
              className={selectClass}
            >
              {MEMBER_POST_TYPES.map((value) => (
                <option key={value} value={value}>
                  {POST_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label={copy.fields.title} error={errors.title} required>
          {(control) => (
            <Input
              {...control}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.fields.body} hint={copy.hints.body} error={errors.body} required>
          {(control) => (
            <Textarea
              {...control}
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-32 bg-white"
            />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={copy.fields.authorName} error={errors.authorName} required>
            {(control) => (
              <Input
                {...control}
                autoComplete="name"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                className={inputClass}
              />
            )}
          </FormField>
          <FormField
            label={copy.fields.authorEmail}
            hint={copy.hints.authorEmail}
            error={errors.authorEmail}
            required
          >
            {(control) => (
              <Input
                {...control}
                type="email"
                autoComplete="email"
                value={authorEmail}
                onChange={(event) => setAuthorEmail(event.target.value)}
                className={inputClass}
              />
            )}
          </FormField>
        </div>

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
    </details>
  );
}
