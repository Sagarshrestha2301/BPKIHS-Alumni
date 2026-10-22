'use client';

import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { communityPage } from '@/content/community';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { REPORT_REASONS, type ReportReason } from '@/lib/constants/domain';

export function ReportPost({ postId, client }: { postId: string; client?: ApiClient }) {
  const copy = communityPage.report;
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      await (client ?? getApiClient()).reportPost(postId, {
        reason,
        ...(details.trim() ? { details: details.trim() } : {}),
      });
      setStatus('done');
    } catch (caught) {
      setStatus('idle');
      setError(isApiError(caught) ? caught.message : copy.error);
    }
  }

  if (status === 'done') {
    return <p className="text-sm text-neutral-600">{copy.success}</p>;
  }

  return (
    <details className="mt-2 text-sm">
      <summary className="text-primary-700 cursor-pointer font-medium">{copy.summary}</summary>
      <form onSubmit={onSubmit} className="mt-3 grid gap-3 rounded-lg bg-neutral-100 p-3">
        <label className="grid gap-1">
          <span className="font-medium text-neutral-900">{copy.reasonLabel}</span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value as ReportReason)}
            className="h-10 rounded-lg border border-neutral-500 bg-white px-2"
          >
            {REPORT_REASONS.map((value) => (
              <option key={value} value={value}>
                {copy.reasons[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="font-medium text-neutral-900">{copy.detailsLabel}</span>
          <Textarea
            rows={2}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            className="bg-white"
          />
        </label>
        {error ? (
          <p role="alert" className="text-danger-600 font-medium">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="outline"
          disabled={status === 'submitting'}
          className="h-9 justify-self-start"
        >
          {status === 'submitting' ? copy.submitting : copy.submit}
        </Button>
      </form>
    </details>
  );
}
