'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { accountPage, profilePage } from '@/content/account';
import { ExpertiseInput } from '@/features/account/expertise-input';
import { getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { profileUpdateSchema } from '@/lib/api/schemas';
import type { Alumnus, Visibility } from '@/lib/api/types';
import { VISIBILITIES } from '@/lib/constants/domain';
import { cn } from '@/lib/utils';

const copy = profilePage;
const inputClass = 'h-11 bg-white';
const selectClass =
  'border-neutral-500 focus-visible:border-primary-700 h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-primary-700/30';

type FieldErrors = Record<string, string>;

function VisibilitySelect({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: Visibility;
  error?: string;
  onChange: (value: Visibility) => void;
}) {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <select
          {...control}
          value={value}
          onChange={(event) => onChange(event.target.value as Visibility)}
          className={selectClass}
        >
          {VISIBILITIES.map((visibility) => (
            <option key={visibility} value={visibility}>
              {accountPage.privacyLabels[visibility]}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

export function ProfileForm({ profile, email }: { profile: Alumnus; email: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [currentPosition, setCurrentPosition] = useState(profile.currentPosition ?? '');
  const [organisation, setOrganisation] = useState(profile.organisation ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [country, setCountry] = useState(profile.country);
  const [furtherStudies, setFurtherStudies] = useState(profile.furtherStudies ?? '');
  const [note, setNote] = useState(profile.note ?? '');
  const [expertise, setExpertise] = useState<string[]>(profile.expertise ?? []);
  const [privacyEmail, setPrivacyEmail] = useState<Visibility>(profile.privacy.email);
  const [privacyPhone, setPrivacyPhone] = useState<Visibility>(profile.privacy.phone);
  const [privacyProfile, setPrivacyProfile] = useState<Visibility>(profile.privacy.profile);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function clearError(field: string): void {
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusFirstError(): void {
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;

    const parsed = profileUpdateSchema.safeParse({
      fullName,
      phone,
      currentPosition,
      organisation,
      city,
      country,
      furtherStudies,
      note,
      expertise,
      privacy: { email: privacyEmail, phone: privacyPhone, profile: privacyProfile },
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path.join('.')] ??= issue.message;
      }
      setErrors(next);
      focusFirstError();
      return;
    }

    setErrors({});
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const updated = await getApiClient().updateMyProfile(parsed.data);
      setExpertise(updated.expertise ?? []);
      setMessage(profile.status === 'rejected' ? copy.savedRequeued : copy.saved);
      router.refresh();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6">
      <section
        aria-labelledby="identity-heading"
        className="rounded-xl border border-neutral-300 bg-neutral-100/60 p-6"
      >
        <h2 id="identity-heading" className="text-primary-900 text-lg font-semibold">
          {copy.identityTitle}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{copy.identityHelp}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-neutral-600">{copy.identity.email}</dt>
            <dd className="font-medium break-words text-neutral-900">{email}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-600">{copy.identity.programme}</dt>
            <dd className="font-medium text-neutral-900">{profile.programme}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-600">{copy.identity.batchYear}</dt>
            <dd className="font-medium text-neutral-900">{profile.batchYear}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 rounded-xl border border-neutral-300 bg-white p-6 shadow-sm sm:grid-cols-2">
        <FormField
          label={copy.fields.fullName.label}
          error={errors.fullName}
          required
          className="sm:col-span-2"
        >
          {(control) => (
            <Input
              {...control}
              autoComplete="name"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                clearError('fullName');
              }}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField
          label={copy.fields.phone.label}
          hint={copy.fields.phone.hint}
          error={errors.phone}
        >
          {(control) => (
            <Input
              {...control}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                clearError('phone');
              }}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.fields.furtherStudies.label} hint={copy.fields.furtherStudies.hint}>
          {(control) => (
            <Input
              {...control}
              value={furtherStudies}
              onChange={(event) => setFurtherStudies(event.target.value)}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField
          label={copy.fields.currentPosition.label}
          hint={copy.fields.currentPosition.hint}
          error={errors.currentPosition}
        >
          {(control) => (
            <Input
              {...control}
              autoComplete="organization-title"
              value={currentPosition}
              onChange={(event) => {
                setCurrentPosition(event.target.value);
                clearError('currentPosition');
              }}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField
          label={copy.fields.organisation.label}
          hint={copy.fields.organisation.hint}
          error={errors.organisation}
        >
          {(control) => (
            <Input
              {...control}
              autoComplete="organization"
              value={organisation}
              onChange={(event) => {
                setOrganisation(event.target.value);
                clearError('organisation');
              }}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.fields.city.label} error={errors.city}>
          {(control) => (
            <Input
              {...control}
              autoComplete="address-level2"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                clearError('city');
              }}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label={copy.fields.country.label} error={errors.country} required>
          {(control) => (
            <Input
              {...control}
              autoComplete="country-name"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                clearError('country');
              }}
              className={inputClass}
            />
          )}
        </FormField>

        <div className="sm:col-span-2">
          <ExpertiseInput value={expertise} onChange={setExpertise} error={errors.expertise} />
        </div>

        <FormField
          label={copy.fields.note.label}
          hint={copy.fields.note.hint}
          error={errors.note}
          className="sm:col-span-2"
        >
          {(control) => (
            <Textarea
              {...control}
              rows={5}
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                clearError('note');
              }}
              className="min-h-32 bg-white"
            />
          )}
        </FormField>
      </div>

      <fieldset className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
        <legend className="text-primary-900 px-1 text-lg font-semibold">
          {copy.privacy.legend}
        </legend>
        <p className="mt-1 mb-4 text-sm text-neutral-600">{copy.privacy.intro}</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <VisibilitySelect
            label={copy.privacy.email}
            value={privacyEmail}
            error={errors['privacy.email']}
            onChange={setPrivacyEmail}
          />
          <VisibilitySelect
            label={copy.privacy.phone}
            value={privacyPhone}
            error={errors['privacy.phone']}
            onChange={setPrivacyPhone}
          />
          <VisibilitySelect
            label={copy.privacy.profile}
            value={privacyProfile}
            error={errors['privacy.profile']}
            onChange={setPrivacyProfile}
          />
        </div>
      </fieldset>

      {message ? (
        <p
          role="status"
          className="border-primary-100 bg-primary-100/50 text-primary-900 rounded-lg border p-3 text-sm"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-danger-600 border-danger-600/30 bg-danger-600/5 rounded-lg border p-3 text-sm font-medium"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy} className="h-11 px-6 text-base font-semibold">
          {busy ? copy.saving : copy.save}
        </Button>
        <Link
          href="/account"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
        >
          {copy.cancel}
        </Link>
      </div>
    </form>
  );
}
