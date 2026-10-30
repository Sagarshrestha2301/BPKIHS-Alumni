'use client';

import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { profilePage } from '@/content/account';
import {
  EXPERTISE_ITEM_MAX_LENGTH,
  EXPERTISE_MAX_ITEMS,
  EXPERTISE_SUGGESTIONS,
} from '@/lib/constants/domain';

const copy = profilePage.fields.expertise;

function normalise(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Expertise tags for the member's profile.
 *
 * The control is a group, not a single input, so it uses a fieldset and keeps every action a
 * real button with an accessible name. The same normalisation runs again in the API schema.
 */
export function ExpertiseInput({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  function add(raw: string): void {
    const candidate = normalise(raw);
    if (!candidate) return;

    if (value.length >= EXPERTISE_MAX_ITEMS) {
      setNotice(copy.full);
      return;
    }
    if (value.some((item) => item.toLowerCase() === candidate.toLowerCase())) {
      setNotice(copy.duplicate);
      return;
    }

    onChange([...value, candidate.slice(0, EXPERTISE_ITEM_MAX_LENGTH)]);
    setDraft('');
    setNotice(null);
  }

  function remove(item: string): void {
    onChange(value.filter((entry) => entry !== item));
    setNotice(null);
  }

  const suggestions = EXPERTISE_SUGGESTIONS.filter(
    (suggestion) => !value.some((item) => item.toLowerCase() === suggestion.toLowerCase()),
  );

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-neutral-900">{copy.label}</legend>
      <p className="text-sm text-neutral-600">{copy.hint}</p>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={copy.label}>
          {value.map((item) => (
            <li key={item}>
              <span className="bg-primary-100 text-primary-900 inline-flex min-h-8 items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-sm font-medium">
                {item}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`${copy.remove} ${item}`}
                  className="hover:bg-primary-700/10 inline-flex size-6 items-center justify-center rounded-full text-base leading-none"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">{copy.none}</p>
      )}

      {suggestions.length > 0 ? (
        <div>
          <p id={`${inputId}-suggestions`} className="text-sm text-neutral-600">
            {copy.suggestions}
          </p>
          <div
            role="group"
            aria-labelledby={`${inputId}-suggestions`}
            className="mt-2 flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                disabled={value.length >= EXPERTISE_MAX_ITEMS}
                className="hover:bg-primary-100 min-h-8 rounded-full border border-neutral-500 px-3 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-900">
            {copy.custom}
          </label>
          <Input
            id={inputId}
            value={draft}
            maxLength={EXPERTISE_ITEM_MAX_LENGTH}
            placeholder={copy.placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              add(draft);
            }}
            className="h-11 bg-white"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => add(draft)}
          disabled={!normalise(draft) || value.length >= EXPERTISE_MAX_ITEMS}
          className="h-11 px-5"
        >
          {copy.add}
        </Button>
      </div>

      {notice ? (
        <p role="status" className="text-sm text-neutral-600">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger-600 text-sm font-medium">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
