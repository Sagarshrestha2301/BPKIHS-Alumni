'use client';

import Link from 'next/link';
import { type ChangeEvent, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminAlumniImportPage as copy } from '@/content/admin';
import {
  detectMapping,
  IMPORT_FIELDS,
  IMPORT_MAX_BYTES,
  IMPORT_MAX_ROWS,
  type ImportField,
  type ImportMapping,
  type ImportPreview,
  type ImportResult,
  parseCsv,
  type ParsedCsv,
} from '@/lib/api/alumni-import';

import { adminRequest } from './admin-request';

const PREVIEW_ROWS = 100;

const STATUS_VARIANT = {
  ready: 'default',
  duplicate: 'secondary',
  invalid: 'destructive',
} as const;

/**
 * The register is parsed once in the browser to show the header names and guess a mapping, then
 * sent as text with that mapping. The server parses it again and returns the preview it will
 * act on; the confirmation posts the same request with `dryRun: false`.
 */
export function AlumniImport() {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'reading' | 'previewing' | 'importing' | null>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCsv('');
    setFileName('');
    setParsed(null);
    setMapping(null);
    setPreview(null);
    setResult(null);
    setError(null);

    if (file.size > IMPORT_MAX_BYTES) {
      setError(copy.tooLarge);
      return;
    }

    setBusy('reading');
    try {
      const text = await file.text();
      const next = parseCsv(text);
      if (next.headers.length === 0) {
        setError(copy.fileError);
        return;
      }
      if (next.rows.length > IMPORT_MAX_ROWS) {
        setError(copy.tooManyRows);
        return;
      }

      setCsv(text);
      setFileName(file.name);
      setParsed(next);
      setMapping(detectMapping(next.headers));
    } finally {
      setBusy(null);
    }
  }

  function setColumn(field: ImportField, value: string): void {
    if (!mapping) return;
    setMapping({ ...mapping, [field]: value === '' ? null : Number(value) });
    setPreview(null);
    setResult(null);
  }

  const requiredMapped =
    mapping !== null &&
    IMPORT_FIELDS.filter((field) => field.required).every((field) => mapping[field.key] !== null);

  async function post<T>(dryRun: boolean): Promise<T> {
    return adminRequest<T>('/api/v1/admin/alumni/import', {
      method: 'POST',
      body: { csv, mapping, dryRun, publish, filename: fileName || undefined },
    });
  }

  async function onPreview(): Promise<void> {
    if (busy) return;
    if (!requiredMapped) {
      setError(copy.mapRequired);
      return;
    }

    setBusy('previewing');
    setError(null);
    try {
      setPreview(await post<ImportPreview>(true));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.error);
    } finally {
      setBusy(null);
    }
  }

  async function onImport(): Promise<void> {
    if (busy || !preview || preview.readyRows === 0) return;

    setBusy('importing');
    setError(null);
    try {
      setResult(await post<ImportResult>(false));
      setPreview(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.error);
    } finally {
      setBusy(null);
    }
  }

  const shownRows = preview?.rows.slice(0, PREVIEW_ROWS) ?? [];

  return (
    <div className="mt-6 grid gap-6">
      <section
        aria-labelledby="import-file"
        className="rounded-xl border border-neutral-300 bg-white p-6"
      >
        <h2 id="import-file" className="font-heading text-primary-900 text-xl font-semibold">
          {copy.fileLabel}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{copy.fileHint}</p>

        <div className="mt-4">
          <label htmlFor="register-file" className="sr-only">
            {copy.fileLabel}
          </label>
          <input
            id="register-file"
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            disabled={busy !== null}
            className="block w-full text-sm text-neutral-700 file:mr-4 file:h-10 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-4 file:text-sm file:font-medium hover:file:bg-neutral-100"
          />
          {fileName ? (
            <p role="status" className="text-primary-900 mt-2 text-sm">
              {fileName}
            </p>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="text-danger-600 border-danger-600/30 bg-danger-600/5 mt-4 rounded-lg border p-3 text-sm font-medium"
          >
            {error}
          </p>
        ) : null}
      </section>

      {parsed && mapping ? (
        <section
          aria-labelledby="import-mapping"
          className="rounded-xl border border-neutral-300 bg-white p-6"
        >
          <h2 id="import-mapping" className="font-heading text-primary-900 text-xl font-semibold">
            {copy.mappingTitle}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{copy.mappingHelp}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {IMPORT_FIELDS.map((field) => {
              const selectId = `import-column-${field.key}`;
              return (
                <div key={field.key}>
                  <label
                    htmlFor={selectId}
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    {field.label}
                    {field.required ? (
                      <span className="ml-1 text-xs font-normal text-neutral-600">
                        ({copy.required})
                      </span>
                    ) : null}
                  </label>
                  <select
                    id={selectId}
                    value={mapping[field.key] ?? ''}
                    onChange={(event) => setColumn(field.key, event.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                  >
                    <option value="">{copy.unmapped}</option>
                    {parsed.headers.map((header, index) => (
                      <option key={`${field.key}-${index}`} value={index}>
                        {header || `Column ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <fieldset className="mt-6 rounded-lg border border-neutral-300 bg-neutral-50 p-4">
            <legend className="text-primary-900 px-1 text-sm font-semibold">
              {copy.visibilityTitle}
            </legend>
            <p className="mt-1 text-sm text-neutral-600">{copy.visibilityHint}</p>
            <div className="mt-4 grid gap-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="import-publish"
                  checked={!publish}
                  onChange={() => setPublish(false)}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="text-primary-900 block font-medium">{copy.holdLabel}</span>
                  <span className="block text-neutral-600">{copy.holdHint}</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="radio"
                  name="import-publish"
                  checked={publish}
                  onChange={() => setPublish(true)}
                  className="mt-1 size-4"
                />
                <span>
                  <span className="text-primary-900 block font-medium">{copy.publishLabel}</span>
                  <span className="block text-neutral-600">{copy.publishHint}</span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onPreview}
              disabled={busy !== null || !requiredMapped}
              className="h-11 scroll-mt-24 px-6 text-base font-semibold"
            >
              {busy === 'previewing' ? copy.previewing : copy.preview}
            </Button>
            <span className="text-sm text-neutral-600">{fileName}</span>
          </div>
        </section>
      ) : null}

      {preview ? (
        <section
          aria-labelledby="import-preview"
          className="rounded-xl border border-neutral-300 bg-white p-6"
        >
          <h2 id="import-preview" className="font-heading text-primary-900 text-xl font-semibold">
            {copy.preview}
          </h2>
          <p role="status" className="mt-2 text-sm font-medium text-neutral-900">
            {copy.summary(preview.readyRows, preview.duplicateRows, preview.invalidRows)}
          </p>

          {preview.totalRows === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">{copy.empty}</p>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-300">
                <table className="w-full min-w-[42rem] text-left text-sm">
                  <caption className="sr-only">{copy.tableCaption}</caption>
                  <thead className="bg-neutral-100 text-xs tracking-wide text-neutral-600 uppercase">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        {copy.columns.row}
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        {copy.columns.person}
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        {copy.columns.email}
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        {copy.columns.status}
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        {copy.columns.message}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300">
                    {shownRows.map((row) => (
                      <tr key={row.row} className="align-top">
                        <td className="px-3 py-2 text-neutral-600">{row.row}</td>
                        <td className="text-primary-900 px-3 py-2 font-medium">
                          {row.fullName || 'Not provided'}
                        </td>
                        <td className="px-3 py-2 text-neutral-600">
                          {row.email || 'Not provided'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={STATUS_VARIANT[row.status]}>
                            {copy.status[row.status]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-neutral-600">
                          {row.message || 'Not provided'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.rows.length > PREVIEW_ROWS ? (
                <p className="mt-2 text-sm text-neutral-600">
                  {copy.showingFirst(PREVIEW_ROWS, preview.rows.length)}
                </p>
              ) : null}
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onImport}
              disabled={busy !== null || preview.readyRows === 0}
              className="h-11 scroll-mt-24 px-6 text-base font-semibold"
            >
              {busy === 'importing' ? copy.importing : copy.import(preview.readyRows)}
            </Button>
            <Link href="/admin/alumni" className="text-primary-700 text-sm underline">
              {copy.viewImported}
            </Link>
          </div>
        </section>
      ) : null}

      {result ? (
        <section
          role="status"
          className="border-success-600/30 bg-success-600/5 rounded-xl border p-6"
        >
          <p className="text-primary-900 font-medium">
            {copy.success(result.imported, result.skipped, result.published)}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/admin/alumni?status=approved" className="text-primary-700 underline">
              {copy.viewImported}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
