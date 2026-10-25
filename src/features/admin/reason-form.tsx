'use client';

import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ReasonFormProps = {
  title: string;
  hint: string;
  label: string;
  submitLabel: string;
  cancelLabel: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
};

/**
 * Rejection always carries a reason. It is written to the audit log, so the form asks for
 * it inline instead of a browser prompt.
 */
export function ReasonForm({
  title,
  hint,
  label,
  submitLabel,
  cancelLabel,
  busy,
  onSubmit,
  onCancel,
}: ReasonFormProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError('Give a short reason (at least 3 characters).');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 rounded-lg border border-neutral-300 bg-neutral-100 p-3"
    >
      <p className="text-primary-900 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-neutral-600">{hint}</p>
      <div className="mt-3">
        <Label htmlFor="reject-reason" className="text-primary-900 text-sm">
          {label}
        </Label>
        <Textarea
          id="reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          className="mt-1.5 bg-white"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'reject-reason-error' : undefined}
        />
      </div>
      {error ? (
        <p id="reject-reason-error" className="text-danger-600 mt-2 text-sm">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={busy}>
          {busy ? 'Working…' : submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}
