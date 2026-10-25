'use client';

import { PlusIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { ZodType } from 'zod';

import { Button } from '@/components/ui/button';
import { adminContentPage as copy } from '@/content/admin-content';
import { isApiError } from '@/lib/api/errors';

import { adminRequest } from '../admin-request';
import { type FormValue, fromDateTimeLocal, rupeesToPaisa } from './values';

export type FieldKind =
  'text' | 'textarea' | 'number' | 'money' | 'datetime' | 'checkbox' | 'select' | 'json';

export interface FieldDef {
  name: string;
  label: string;
  kind?: FieldKind;
  options?: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
  full?: boolean;
  placeholder?: string;
}

export const controlClass =
  'h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700';
export const areaClass =
  'min-h-24 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700';

function collect(form: FormData, fields: FieldDef[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = form.get(field.name);
    const text = typeof raw === 'string' ? raw.trim() : '';
    const kind = field.kind ?? 'text';

    switch (kind) {
      case 'checkbox':
        payload[field.name] = form.get(field.name) === 'on';
        break;
      case 'number': {
        if (text) payload[field.name] = Number(text);
        break;
      }
      case 'money': {
        if (text) payload[field.name] = rupeesToPaisa(text);
        break;
      }
      case 'datetime': {
        const value = fromDateTimeLocal(text);
        if (value) payload[field.name] = value;
        break;
      }
      case 'json': {
        if (text) payload[field.name] = JSON.parse(text) as unknown;
        break;
      }
      case 'select': {
        if (text) payload[field.name] = text;
        break;
      }
      default:
        payload[field.name] = text;
    }
  }

  return payload;
}

export interface RecordEditorProps<T extends { id: string }> {
  section: string;
  items: T[];
  fields: FieldDef[];
  schema: ZodType<unknown>;
  endpoint: string;
  emptyLabel: string;
  toDefaults: (item: T) => Record<string, FormValue>;
  /** Values used when creating a new record, for selects and numbers with a default. */
  newDefaults?: Record<string, FormValue>;
  display: (item: T) => { title: string; detail?: string };
  /** Replaces the item list after a save, for sections whose order matters. */
  sortItems?: (items: T[]) => T[];
}

export function RecordEditor<T extends { id: string }>({
  section,
  items: initialItems,
  fields,
  schema,
  endpoint,
  emptyLabel,
  toDefaults,
  newDefaults = {},
  display,
  sortItems,
}: RecordEditorProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const current =
    editing && editing !== 'new' ? items.find((item) => item.id === editing) : undefined;
  const defaults: Record<string, FormValue> = current ? toDefaults(current) : { ...newDefaults };

  function openNew() {
    setEditing('new');
    setError(null);
    setNotice(null);
  }

  function openEdit(id: string) {
    setEditing(id);
    setError(null);
    setNotice(null);
  }

  function close() {
    setEditing(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setNotice(null);

    let parsedInput: unknown;
    try {
      parsedInput = collect(new FormData(event.currentTarget), fields);
    } catch {
      setError('The gallery must be valid JSON.');
      return;
    }

    const parsed = schema.safeParse(parsedInput);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the highlighted fields.');
      return;
    }

    setPending(true);
    try {
      const saved = await adminRequest<T>(
        editing === 'new' ? endpoint : `${endpoint}/${encodeURIComponent(editing as string)}`,
        { method: editing === 'new' ? 'POST' : 'PATCH', body: parsed.data },
      );

      const next =
        editing === 'new'
          ? [...items, saved]
          : items.map((item) => (item.id === saved.id ? saved : item));
      setItems(sortItems ? sortItems(next) : next);
      setNotice(copy.saved);
      setEditing(null);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'That change did not go through.');
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(copy.confirmDelete)) return;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await adminRequest(`${endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setItems(items.filter((item) => item.id !== id));
      if (editing === id) setEditing(null);
      setNotice(copy.deleted);
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'That change did not go through.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby={`${section}-heading`} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={`${section}-heading`}
          className="font-heading text-primary-900 text-xl font-semibold"
        >
          {copy.sections[section as keyof typeof copy.sections]}
        </h2>
        <Button type="button" onClick={openNew} className="h-9">
          <PlusIcon aria-hidden="true" className="size-4" />
          {copy.newItem}
        </Button>
      </div>

      {(error || notice) && (
        <p
          role={error ? 'alert' : 'status'}
          className={error ? 'text-danger-600 text-sm' : 'text-primary-700 text-sm'}
        >
          {error ?? notice}
        </p>
      )}

      {editing !== null && (
        <form
          key={editing}
          onSubmit={onSubmit}
          noValidate
          className="rounded-xl border border-neutral-300 bg-white p-5"
        >
          <p className="text-primary-900 mb-3 font-medium">
            {editing === 'new' ? copy.newItem : copy.editItem}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.full ? 'sm:col-span-2' : undefined}>
                <label
                  htmlFor={`${section}-${field.name}`}
                  className="text-primary-900 mb-1 block text-sm font-medium"
                >
                  {field.label}
                </label>
                {field.kind === 'textarea' || field.kind === 'json' ? (
                  <textarea
                    id={`${section}-${field.name}`}
                    name={field.name}
                    defaultValue={String(defaults[field.name] ?? '')}
                    required={field.required}
                    rows={field.kind === 'json' ? 4 : 5}
                    className={areaClass}
                  />
                ) : field.kind === 'select' ? (
                  <select
                    id={`${section}-${field.name}`}
                    name={field.name}
                    defaultValue={String(defaults[field.name] ?? '')}
                    className={controlClass}
                  >
                    <option value="">{copy.none}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.kind === 'checkbox' ? (
                  <label className="flex h-10 items-center gap-2 text-sm text-neutral-700">
                    <input
                      id={`${section}-${field.name}`}
                      name={field.name}
                      type="checkbox"
                      defaultChecked={defaults[field.name] === true}
                      className="size-4 rounded border-neutral-400"
                    />
                    {field.hint ?? field.label}
                  </label>
                ) : (
                  <input
                    id={`${section}-${field.name}`}
                    name={field.name}
                    type={
                      field.kind === 'number' || field.kind === 'money'
                        ? 'number'
                        : field.kind === 'datetime'
                          ? 'datetime-local'
                          : 'text'
                    }
                    step={field.kind === 'money' ? '0.01' : undefined}
                    min={field.kind === 'number' || field.kind === 'money' ? 0 : undefined}
                    defaultValue={String(defaults[field.name] ?? '')}
                    required={field.required}
                    placeholder={field.placeholder}
                    className={controlClass}
                  />
                )}
                {field.hint && field.kind !== 'checkbox' ? (
                  <p className="mt-1 text-xs text-neutral-600">{field.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending} className="h-10">
              {pending ? copy.saving : copy.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={pending}
              className="h-10"
            >
              {copy.cancel}
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-neutral-300 bg-white p-5 text-neutral-600">
          {emptyLabel}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-300 rounded-xl border border-neutral-300 bg-white">
          {items.map((item) => {
            const label = display(item);
            return (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-primary-900 font-medium">{label.title}</p>
                  {label.detail ? (
                    <p className="mt-1 text-sm text-neutral-600">{label.detail}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEdit(item.id)}
                    disabled={pending}
                    className="h-9"
                  >
                    {copy.editItem}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(item.id)}
                    disabled={pending}
                    className="h-9"
                  >
                    {copy.deleteItem}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
