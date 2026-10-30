'use client';

import Link from 'next/link';
import { type FormEvent, useState, useSyncExternalStore } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supportPage } from '@/content/support';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { helpdeskSchema } from '@/lib/api/schemas';
import { HELPDESK_TOPICS, type HelpdeskTopic } from '@/lib/constants/domain';
import { cn } from '@/lib/utils';

const inputClass = 'h-11 bg-white';
const selectClass =
  'border-neutral-500 focus-visible:border-primary-700 h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-primary-700/30';

/** The draft a signed-out visitor leaves behind when the form asks them to sign in. */
const DRAFT_KEY = 'bpkihs.support.draft';

type FieldName = 'name' | 'email' | 'topic' | 'subject' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;

type Author = { name: string; email: string };

type Draft = {
  topic: HelpdeskTopic;
  name: string;
  email: string;
  subject: string;
  message: string;
};

function readDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Draft>;
    if (typeof value.subject !== 'string' || typeof value.message !== 'string') return null;
    const topic = HELPDESK_TOPICS.find((item) => item === value.topic) ?? 'general';
    return {
      topic,
      name: typeof value.name === 'string' ? value.name : '',
      email: typeof value.email === 'string' ? value.email : '',
      subject: value.subject,
      message: value.message,
    };
  } catch {
    return null;
  }
}

/*
 * The draft lives in session storage, which the server cannot see. Reading it through an
 * external store keeps the hydrated form identical to the server's while still bringing the
 * message back on the return trip from sign-in, without a state write inside an effect.
 */
let cachedDraft: Draft | null = null;
let draftLoaded = false;

function getDraftSnapshot(): Draft | null {
  if (!draftLoaded) {
    cachedDraft = readDraft();
    draftLoaded = true;
  }
  return cachedDraft;
}

/** The server and the hydration render never know about the browser's draft. */
function getDraftServerSnapshot(): Draft | null {
  return null;
}

const subscribeDraft = () => () => {};

function saveDraft(draft: Draft): void {
  cachedDraft = draft;
  draftLoaded = true;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // A browser with storage turned off simply loses the draft; sending still works.
  }
}

function clearDraft(): void {
  cachedDraft = null;
  draftLoaded = true;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * The helpdesk form.
 *
 * A signed-out visitor fills in the same form and is only asked to sign in after pressing
 * Send: the message is kept, the dialog offers the ways in, and the form comes back filled on
 * the return trip. A signed-in member is addressed through their account and never sees the
 * name and email fields.
 */
export function HelpdeskForm({ client, author }: { client?: ApiClient; author: Author | null }) {
  const copy = supportPage;
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getDraftServerSnapshot);

  // A field is its typed value when there is one, otherwise the draft's, otherwise empty.
  const [topicChoice, setTopicChoice] = useState<HelpdeskTopic | null>(null);
  const [nameChoice, setNameChoice] = useState<string | null>(null);
  const [emailChoice, setEmailChoice] = useState<string | null>(null);
  const [subjectChoice, setSubjectChoice] = useState<string | null>(null);
  const [messageChoice, setMessageChoice] = useState<string | null>(null);

  const topic = topicChoice ?? draft?.topic ?? 'general';
  const name = nameChoice ?? (author ? author.name : (draft?.name ?? ''));
  const email = emailChoice ?? (author ? author.email : (draft?.email ?? ''));
  const subject = subjectChoice ?? draft?.subject ?? '';
  const message = messageChoice ?? draft?.message ?? '';

  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [askToSignIn, setAskToSignIn] = useState(false);

  const currentDraft: Draft = { topic, name, email, subject, message };
  // Only a member sees the note; for a visitor the prefilled fields are enough.
  const draftRestored = Boolean(draft && author);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status === 'submitting') return;

    const parsed = helpdeskSchema.safeParse({
      topic,
      name: author ? author.name : name,
      email: author ? author.email : email,
      subject,
      message,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'name' ||
          field === 'email' ||
          field === 'topic' ||
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

    // Not signed in: keep the finished message and ask for the account at the point of sending.
    if (!author) {
      saveDraft(currentDraft);
      setAskToSignIn(true);
      return;
    }

    setError(null);
    setStatus('submitting');
    try {
      const result = await (client ?? getApiClient()).submitSupportTicket(parsed.data);
      clearDraft();
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
    <>
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {draftRestored ? (
          <p
            role="status"
            className="border-primary-700/25 bg-primary-100/60 text-primary-900 rounded-lg border px-4 py-3 text-sm"
          >
            {copy.draftRestored}
          </p>
        ) : null}

        {author ? (
          <div className="border-primary-100 bg-primary-100/50 grid gap-1 rounded-lg border px-4 py-3 sm:grid-cols-[auto_1fr] sm:items-baseline sm:gap-3">
            <span className="text-primary-900 text-sm font-semibold">{copy.sendingAs}</span>
            <span className="text-sm break-words text-neutral-600">
              {author.name} · {author.email}
            </span>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label={copy.fields.name} error={errors.name} required>
              {(control) => (
                <Input
                  {...control}
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setNameChoice(event.target.value)}
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
                  value={email}
                  onChange={(event) => setEmailChoice(event.target.value)}
                  className={inputClass}
                />
              )}
            </FormField>
          </div>
        )}

        <FormField label={copy.fields.topic} error={errors.topic} required>
          {(control) => (
            <select
              {...control}
              value={topic}
              onChange={(event) => setTopicChoice(event.target.value as HelpdeskTopic)}
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

        <FormField label={copy.fields.subject} error={errors.subject} required>
          {(control) => (
            <Input
              {...control}
              value={subject}
              onChange={(event) => setSubjectChoice(event.target.value)}
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
              onChange={(event) => setMessageChoice(event.target.value)}
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

      <Dialog open={askToSignIn} onOpenChange={setAskToSignIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-primary-900 text-xl font-semibold">
              {copy.signInPrompt.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-600">
              {copy.signInPrompt.text}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {copy.signInPrompt.keepEditing}
            </DialogClose>
            <Link
              href="/register"
              onClick={() => {
                saveDraft(currentDraft);
                setAskToSignIn(false);
              }}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-10 px-4 text-sm')}
            >
              {copy.signInPrompt.register}
            </Link>
            <Link
              href={`/sign-in?next=${encodeURIComponent('/support')}`}
              onClick={() => {
                saveDraft(currentDraft);
                setAskToSignIn(false);
              }}
              className={cn(buttonVariants(), 'h-10 px-4 text-sm')}
            >
              {copy.signInPrompt.signIn}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
