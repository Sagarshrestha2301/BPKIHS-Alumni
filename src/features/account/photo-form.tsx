'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { InitialsAvatar } from '@/components/shared/initials-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { profilePage } from '@/content/account';
import { photoCopy } from '@/content/photo';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import type { OwnAlumnus } from '@/lib/api/types';
import { PHOTO_ACCEPT } from '@/lib/constants/photo';
import { type PhotoProblem, validatePhotoFile } from '@/lib/photo/validate';

const copy = profilePage.photo;

function photoProblemMessage(problem: PhotoProblem): string {
  return photoCopy.errors[problem];
}

/**
 * The photo is independent of the profile form so a large image never holds up a text edit.
 * A replacement keeps the previous consent; a first upload requires the explicit checkbox,
 * and the server repeats that check.
 */
export function PhotoForm({ profile }: { profile: OwnAlumnus }) {
  const router = useRouter();
  const [selected, setSelected] = useState<File | null>(null);
  const [consent, setConsent] = useState(profile.photoConsent);
  const [consentRecorded, setConsentRecorded] = useState(profile.photoConsent);
  const [fileError, setFileError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const preview = useMemo(() => {
    if (!selected || typeof URL.createObjectURL !== 'function') return null;
    return URL.createObjectURL(selected);
  }, [selected]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const displayUrl = removed ? null : (preview ?? uploadedUrl ?? profile.photoUrl);
  const hasStoredPhoto = Boolean(!removed && (uploadedUrl ?? profile.photoUrl));

  function onSelect(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);
    setConsentError(null);
    setError(null);
    setMessage(null);
    setConfirmRemove(false);

    if (!file) {
      setSelected(null);
      return;
    }

    const problem = validatePhotoFile(file);
    if (problem) {
      setSelected(null);
      setFileError(photoProblemMessage(problem));
      event.target.value = '';
      return;
    }

    setSelected(file);
    setRemoved(false);
  }

  function clearSelection(): void {
    setSelected(null);
    setFileError(null);
    setConsentError(null);
  }

  async function onUpload(): Promise<void> {
    if (!selected || busy) return;
    if (!consentRecorded && !consent) {
      setConsentError(photoCopy.errors.consent);
      return;
    }

    setBusy('upload');
    setError(null);
    setMessage(null);
    setFileError(null);
    setConsentError(null);

    try {
      const result = await getApiClient().uploadMyPhoto({ file: selected, consent });
      setUploadedUrl(result.photoUrl ?? null);
      setSelected(null);
      setConsent(true);
      setConsentRecorded(true);
      setRemoved(false);
      setMessage(copy.saved);
      router.refresh();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : photoCopy.errors.upload);
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(): Promise<void> {
    if (busy) return;
    setBusy('remove');
    setError(null);
    setMessage(null);

    try {
      await getApiClient().removeMyPhoto();
      setSelected(null);
      setUploadedUrl(null);
      setConsent(false);
      setConsentRecorded(false);
      setRemoved(true);
      setConfirmRemove(false);
      setMessage(copy.removed);
      router.refresh();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : photoCopy.errors.remove);
      setConfirmRemove(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="photo-heading"
      className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm"
    >
      <h2 id="photo-heading" className="text-primary-900 text-lg font-semibold">
        {copy.title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">{copy.description}</p>

      <div className="mt-5 flex flex-wrap items-start gap-5">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={`${photoCopy.altPrefix} ${profile.fullName}`}
            width={128}
            height={128}
            unoptimized
            className="size-32 shrink-0 rounded-full border border-neutral-300 object-cover"
          />
        ) : (
          <InitialsAvatar name={profile.fullName} className="size-32 text-3xl" />
        )}

        <div className="grid min-w-0 flex-1 gap-4 sm:min-w-64">
          <FormField
            label={selected ? copy.change : copy.choose}
            hint={copy.hint}
            error={fileError ?? undefined}
          >
            {(control) => (
              <Input
                {...control}
                type="file"
                accept={PHOTO_ACCEPT}
                onChange={onSelect}
                className="h-11 bg-white file:mr-3"
              />
            )}
          </FormField>

          {selected ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-sm text-neutral-700">{selected.name}</p>
              <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                {copy.clear}
              </Button>
            </div>
          ) : displayUrl ? null : (
            <p className="text-sm text-neutral-600">{copy.none}</p>
          )}

          {consentRecorded ? (
            <p className="text-sm text-neutral-600">{photoCopy.consentRecorded}</p>
          ) : selected ? (
            <FormField
              label={photoCopy.consentLabel}
              hint={photoCopy.consentHint}
              error={consentError ?? undefined}
              required
            >
              {(control) => (
                <Checkbox
                  {...control}
                  checked={consent}
                  onCheckedChange={(checked) => {
                    setConsent(checked === true);
                    setConsentError(null);
                  }}
                />
              )}
            </FormField>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onUpload}
              disabled={!selected || busy !== null}
              className="h-11 px-5 text-base"
            >
              {busy === 'upload' ? copy.uploading : copy.upload}
            </Button>

            {hasStoredPhoto && !confirmRemove ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmRemove(true)}
                disabled={busy !== null}
                className="h-11 px-5 text-base"
              >
                {copy.remove}
              </Button>
            ) : null}
          </div>

          {confirmRemove ? (
            <div
              role="group"
              aria-labelledby="remove-photo-heading"
              className="border-danger-600/30 bg-danger-600/5 rounded-lg border p-4"
            >
              <h3 id="remove-photo-heading" className="text-base font-semibold text-neutral-900">
                {copy.removeTitle}
              </h3>
              <p className="mt-1 text-sm text-neutral-700">{copy.removeHelp}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onRemove}
                  disabled={busy !== null}
                >
                  {busy === 'remove' ? copy.removing : copy.removeConfirm}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmRemove(false)}
                  disabled={busy !== null}
                >
                  {copy.removeCancel}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className="border-primary-100 bg-primary-100/50 text-primary-900 mt-5 rounded-lg border p-3 text-sm"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-danger-600 border-danger-600/30 bg-danger-600/5 mt-5 rounded-lg border p-3 text-sm font-medium"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
