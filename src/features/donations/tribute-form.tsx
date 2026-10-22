'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { tributePage } from '@/content/donate';
import { tributeSchema } from '@/lib/api/schemas';
import { MIN_DONATION_MINOR } from '@/lib/constants/domain';
import { cn } from '@/lib/utils';

const inputClass = 'h-11 bg-white';
const selectClass =
  'border-neutral-500 focus-visible:border-primary-700 h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-primary-700/30';

export function TributeForm() {
  const copy = tributePage;
  const router = useRouter();
  const [type, setType] = useState<'in_honour' | 'in_memory'>('in_honour');
  const [recipientKind, setRecipientKind] = useState<'batch' | 'mentor' | 'alumnus'>('batch');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [amount, setAmount] = useState('5000');
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = tributeSchema.safeParse({
      type,
      recipientKind,
      name,
      message,
      notifyEmail,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? copy.error);
      return;
    }
    const amountMinor = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor < MIN_DONATION_MINOR) {
      setError(copy.amountLabel + ' must be at least NPR 100.');
      return;
    }

    setError(null);
    const params = new URLSearchParams({
      tributeType: parsed.data.type,
      tributeKind: parsed.data.recipientKind,
      tributeName: parsed.data.name,
      amount: String(amountMinor),
    });
    if (parsed.data.message) params.set('tributeMessage', parsed.data.message);
    if (parsed.data.notifyEmail) params.set('tributeNotify', parsed.data.notifyEmail);
    router.push(`/donate/checkout?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8"
    >
      <h2 className="font-heading text-primary-900 text-2xl font-semibold">{copy.formTitle}</h2>

      <fieldset className="mt-6">
        <legend className="text-primary-900 mb-2 text-base font-semibold">{copy.typeLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['in_honour', copy.inHonour],
              ['in_memory', copy.inMemory],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4',
                type === value ? 'border-primary-700 bg-primary-100/50' : 'border-neutral-300',
              )}
            >
              <input
                type="radio"
                name="tributeType"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="accent-primary-700 size-4"
              />
              <span className="font-medium text-neutral-900">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <FormField label={copy.recipientLabel} required>
          {(control) => (
            <select
              {...control}
              value={recipientKind}
              onChange={(event) =>
                setRecipientKind(event.target.value as 'batch' | 'mentor' | 'alumnus')
              }
              className={selectClass}
            >
              {(['batch', 'mentor', 'alumnus'] as const).map((kind) => (
                <option key={kind} value={kind}>
                  {copy.recipientKinds[kind]}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label={copy.nameLabel} required>
          {(control) => (
            <Input
              {...control}
              value={name}
              placeholder={copy.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.amountLabel} required>
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={100}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.notifyLabel} hint={copy.notifyHint}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              value={notifyEmail}
              onChange={(event) => setNotifyEmail(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.messageLabel} className="sm:col-span-2">
          {(control) => (
            <Textarea
              {...control}
              rows={4}
              value={message}
              placeholder={copy.messagePlaceholder}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-28 bg-white"
            />
          )}
        </FormField>
      </div>

      {error ? (
        <p role="alert" className="text-danger-600 mt-4 text-sm font-medium">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" className="h-11 px-6 text-base font-semibold">
          {copy.buttons.submit}
        </Button>
      </div>
    </form>
  );
}
