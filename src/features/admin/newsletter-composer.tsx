'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { adminNewsletterPage as copy } from '@/content/admin-content';
import { isApiError } from '@/lib/api/errors';
import { NEWSLETTER_SUBJECT_MAX_LENGTH } from '@/lib/constants/domain';

import { adminRequest } from './admin-request';
import { areaClass, controlClass } from './content/record-editor';

interface SendResult {
  test: boolean;
  campaign: { sentCount: number; failedCount: number };
}

export function NewsletterComposer({ subscribed, total }: { subscribed: number; total: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const testEmail = String(form.get('testEmail') ?? '').trim();
    if (!testEmail && !window.confirm(copy.confirmSend)) return;

    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await adminRequest<SendResult>('/api/v1/admin/newsletter', {
        method: 'POST',
        body: {
          subject: String(form.get('subject') ?? '').trim(),
          body: String(form.get('body') ?? '').trim(),
          ...(testEmail ? { testEmail } : {}),
        },
      });
      setNotice(
        result.test
          ? copy.sentTest
          : copy.sentSummary(result.campaign.sentCount, result.campaign.failedCount),
      );
      if (!result.test) router.refresh();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : copy.failedSend);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="campaign-heading"
      className="rounded-xl border border-neutral-300 bg-white p-5"
    >
      <h2 id="campaign-heading" className="font-heading text-primary-900 text-xl font-semibold">
        {copy.composerTitle}
      </h2>
      <p className="mt-1 text-sm text-neutral-600">{copy.composerHint}</p>
      <p className="mt-1 text-sm text-neutral-600">{copy.subscribersCount(subscribed, total)}</p>

      {(error || notice) && (
        <p
          role={error ? 'alert' : 'status'}
          className={error ? 'text-danger-600 mt-3 text-sm' : 'text-primary-700 mt-3 text-sm'}
        >
          {error ?? notice}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="campaign-subject"
            className="text-primary-900 mb-1 block text-sm font-medium"
          >
            {copy.subjectLabel}
          </label>
          <input
            id="campaign-subject"
            name="subject"
            required
            maxLength={NEWSLETTER_SUBJECT_MAX_LENGTH}
            className={controlClass}
          />
        </div>
        <div>
          <label
            htmlFor="campaign-body"
            className="text-primary-900 mb-1 block text-sm font-medium"
          >
            {copy.bodyLabel}
          </label>
          <textarea id="campaign-body" name="body" required rows={10} className={areaClass} />
        </div>
        <div>
          <label
            htmlFor="campaign-test"
            className="text-primary-900 mb-1 block text-sm font-medium"
          >
            {copy.testLabel}
          </label>
          <input
            id="campaign-test"
            name="testEmail"
            type="email"
            autoComplete="email"
            className={`${controlClass} sm:max-w-sm`}
          />
        </div>
        <Button type="submit" disabled={pending} className="h-10">
          {pending ? copy.sending : copy.sendAll}
        </Button>
      </form>
    </section>
  );
}
