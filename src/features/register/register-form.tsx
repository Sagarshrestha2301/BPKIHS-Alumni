'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Stepper } from '@/components/shared/stepper';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { registerPage } from '@/content/register';
import {
  COUNTRY_OPTIONS,
  createInitialRegisterValues,
  OTHER_COUNTRY,
  type RegisterFormValues,
} from '@/features/register/register-form-values';
import { REGISTER_STEPS } from '@/features/register/register-steps';
import { type FieldErrors, validateAll } from '@/features/register/validate-all';
import { validateStep } from '@/features/register/validate-step';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import type { RegistrationResult } from '@/lib/api/types';
import {
  PROGRAMMES,
  REGISTRATION_CODE_RESEND_SECONDS,
  VISIBILITIES,
  type Visibility,
} from '@/lib/constants/domain';
import { cn } from '@/lib/utils';

const inputClass = 'h-11 bg-white';
const selectClass =
  'border-neutral-500 focus-visible:border-primary-700 h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-primary-700/30';

type Status = 'idle' | 'submitting' | 'verify' | 'verifying' | 'success';

const CODE_PATTERN = /^\d{4,8}$/;

function VisibilitySelect({
  label,
  value,
  options,
  error,
  onChange,
}: {
  label: string;
  value: Visibility;
  options: Record<Visibility, string>;
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
              {options[visibility]}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

export function RegisterForm({ client }: { client?: ApiClient }) {
  const copy = registerPage;
  const [values, setValues] = useState<RegisterFormValues>(createInitialRegisterValues);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // A code cannot be resent while the previous one is still fresh, and the button says how long.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  function update<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (current[field] === undefined) return current;
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

  function goToStep(next: number): void {
    setErrors({});
    setStep(next);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView?.({ block: 'start' });
    });
  }

  function onBack(): void {
    if (step > 0) goToStep(step - 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (status === 'submitting') return;

    if (step < REGISTER_STEPS.length - 1) {
      const validation = validateStep(step, values);
      if (!validation.ok) {
        setErrors(validation.errors);
        focusFirstError();
        return;
      }
      goToStep(step + 1);
      return;
    }

    const validation = validateAll(values);
    if (!validation.ok) {
      setStep(validation.firstInvalidStep);
      setErrors(validation.errors);
      focusFirstError();
      return;
    }

    setStatus('submitting');
    setSubmitError(null);
    try {
      const registration = await (client ?? getApiClient()).submitRegistration(validation.data);
      setResult(registration);
      setCode('');
      setVerifyError(null);
      setNotice(null);
      setSecondsLeft(REGISTRATION_CODE_RESEND_SECONDS);
      setStatus('verify');
    } catch (error) {
      setStatus('idle');
      setSubmitError(isApiError(error) ? error.message : copy.error);
    }
  }

  async function onVerify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!result || status === 'verifying') return;

    const otp = code.trim();
    if (!CODE_PATTERN.test(otp)) {
      setVerifyError(copy.verify.codeError);
      return;
    }

    setStatus('verifying');
    setVerifyError(null);
    try {
      await (client ?? getApiClient()).verifyRegistration({ email: result.email, otp });
      setStatus('success');
    } catch (error) {
      setVerifyError(isApiError(error) ? error.message : copy.error);
      setStatus('verify');
    }
  }

  async function onResend(): Promise<void> {
    if (!result || secondsLeft > 0) return;
    setVerifyError(null);
    setNotice(null);
    setSecondsLeft(REGISTRATION_CODE_RESEND_SECONDS);
    try {
      await (client ?? getApiClient()).resendRegistrationCode({ email: result.email });
      setNotice(copy.verify.sent);
    } catch (error) {
      setVerifyError(isApiError(error) ? error.message : copy.verify.deliveryFailed);
    }
  }

  if ((status === 'verify' || status === 'verifying') && result) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
        <h2 className="font-heading text-primary-900 text-2xl font-semibold">
          {copy.verify.title}
        </h2>
        <p className="text-body-l mt-3 text-neutral-600">
          {copy.verify.body} <span className="font-medium text-neutral-900">{result.email}</span>.{' '}
          {copy.verify.instruction}
        </p>

        <form onSubmit={onVerify} noValidate className="mt-6 grid gap-5">
          <FormField
            label={copy.verify.codeLabel}
            hint={copy.verify.codeHint}
            error={verifyError ?? undefined}
            required
          >
            {(control) => (
              <Input
                {...control}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={8}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className={`${inputClass} tracking-[0.4em]`}
              />
            )}
          </FormField>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={status === 'verifying'}
              className="h-11 px-6 text-base font-semibold"
            >
              {status === 'verifying' ? copy.verify.submitting : copy.verify.submit}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onResend}
              disabled={secondsLeft > 0}
              className="h-11 px-5 text-base"
            >
              {secondsLeft > 0 ? `${copy.verify.resendIn} ${secondsLeft}s` : copy.verify.resend}
            </Button>
          </div>

          {notice ? (
            <p
              role="status"
              className="text-primary-900 border-primary-100 bg-primary-100/50 rounded-lg border p-3 text-sm"
            >
              {notice}
            </p>
          ) : null}

          <p className="text-sm text-neutral-600">{copy.verify.notReceived}</p>
          <p className="text-sm text-neutral-600">{copy.verify.changeEmail}</p>
        </form>
      </div>
    );
  }

  if (status === 'success' && result) {
    return (
      <div
        role="status"
        className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8"
      >
        <h2 className="font-heading text-primary-900 text-2xl font-semibold">
          {copy.success.title}
        </h2>
        <p className="text-body-l mt-3 max-w-2xl text-neutral-600">{copy.success.body}</p>
        <p className="mt-6 text-sm text-neutral-600">
          {copy.success.reference}: <span className="font-mono text-neutral-900">{result.id}</span>
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/account" className={cn(buttonVariants(), 'h-11 px-5 text-base')}>
            {copy.success.account}
          </Link>
          <Link
            href="/directory"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
          >
            {copy.success.directory}
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-base')}
          >
            {copy.success.home}
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = REGISTER_STEPS[step];
  if (!currentStep) throw new RangeError('Unknown registration step ' + step);

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper steps={REGISTER_STEPS} currentIndex={step} className="mb-8" />

      <form ref={formRef} onSubmit={onSubmit} noValidate>
        <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm text-neutral-600">{copy.requiredNote}</p>

          {step === 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                label={copy.fields.fullName.label}
                hint={copy.fields.fullName.hint}
                error={errors.fullName}
                required
                className="sm:col-span-2"
              >
                {(control) => (
                  <Input
                    {...control}
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(event) => update('fullName', event.target.value)}
                    className={inputClass}
                  />
                )}
              </FormField>

              <FormField label={copy.fields.programme.label} error={errors.programme} required>
                {(control) => (
                  <select
                    {...control}
                    value={values.programme}
                    onChange={(event) =>
                      update('programme', event.target.value as RegisterFormValues['programme'])
                    }
                    className={selectClass}
                  >
                    <option value="">{copy.fields.programme.placeholder}</option>
                    {PROGRAMMES.map((programme) => (
                      <option key={programme} value={programme}>
                        {programme}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              <FormField
                label={copy.fields.batchYear.label}
                hint={copy.fields.batchYear.hint}
                error={errors.batchYear}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={copy.fields.batchYear.placeholder}
                    value={values.batchYear}
                    onChange={(event) => update('batchYear', event.target.value)}
                    className={inputClass}
                  />
                )}
              </FormField>

              <FormField label={copy.fields.country.label} error={errors.country} required>
                {(control) => (
                  <select
                    {...control}
                    value={values.country}
                    onChange={(event) => update('country', event.target.value)}
                    className={selectClass}
                  >
                    <option value="">{copy.fields.country.placeholder}</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>

              {values.country === OTHER_COUNTRY ? (
                <FormField
                  label={copy.fields.countryOther.label}
                  error={errors.countryOther}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      autoComplete="country-name"
                      placeholder={copy.fields.countryOther.placeholder}
                      value={values.countryOther}
                      onChange={(event) => update('countryOther', event.target.value)}
                      className={inputClass}
                    />
                  )}
                </FormField>
              ) : null}

              <FormField label={copy.fields.city.label} error={errors.city}>
                {(control) => (
                  <Input
                    {...control}
                    autoComplete="address-level2"
                    placeholder={copy.fields.city.placeholder}
                    value={values.city}
                    onChange={(event) => update('city', event.target.value)}
                    className={inputClass}
                  />
                )}
              </FormField>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label={copy.fields.currentPosition.label} error={errors.currentPosition}>
                {(control) => (
                  <Input
                    {...control}
                    autoComplete="organization-title"
                    placeholder={copy.fields.currentPosition.placeholder}
                    value={values.currentPosition}
                    onChange={(event) => update('currentPosition', event.target.value)}
                    className={inputClass}
                  />
                )}
              </FormField>

              <FormField label={copy.fields.organisation.label} error={errors.organisation}>
                {(control) => (
                  <Input
                    {...control}
                    autoComplete="organization"
                    placeholder={copy.fields.organisation.placeholder}
                    value={values.organisation}
                    onChange={(event) => update('organisation', event.target.value)}
                    className={inputClass}
                  />
                )}
              </FormField>

              <FormField
                label={copy.fields.furtherStudies.label}
                hint={copy.fields.furtherStudies.hint}
                error={errors.furtherStudies}
                className="sm:col-span-2"
              >
                {(control) => (
                  <Input
                    {...control}
                    placeholder={copy.fields.furtherStudies.placeholder}
                    value={values.furtherStudies}
                    onChange={(event) => update('furtherStudies', event.target.value)}
                    className={inputClass}
                  />
                )}
              </FormField>

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
                    placeholder={copy.fields.note.placeholder}
                    value={values.note}
                    onChange={(event) => update('note', event.target.value)}
                    className="min-h-32 bg-white"
                  />
                )}
              </FormField>

              <FormField
                label={copy.fields.photo.label}
                hint={copy.fields.photo.hint}
                className="sm:col-span-2"
              >
                {(control) => (
                  <Input
                    {...control}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled
                    className="h-11 bg-white file:mr-3"
                  />
                )}
              </FormField>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 grid gap-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={copy.fields.email.label}
                  hint={copy.fields.email.hint}
                  error={errors.email}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(event) => update('email', event.target.value)}
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
                      placeholder={copy.fields.phone.placeholder}
                      value={values.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      className={inputClass}
                    />
                  )}
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={copy.fields.password.label}
                  hint={copy.fields.password.hint}
                  error={errors.password}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="password"
                      autoComplete="new-password"
                      value={values.password}
                      onChange={(event) => update('password', event.target.value)}
                      className={inputClass}
                    />
                  )}
                </FormField>

                <FormField
                  label={copy.fields.confirmPassword.label}
                  hint={copy.fields.confirmPassword.hint}
                  error={errors.confirmPassword}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="password"
                      autoComplete="new-password"
                      value={values.confirmPassword}
                      onChange={(event) => update('confirmPassword', event.target.value)}
                      className={inputClass}
                    />
                  )}
                </FormField>
              </div>

              <fieldset className="rounded-lg border border-neutral-300 bg-neutral-100/60 p-4">
                <legend className="text-primary-900 px-1 text-base font-semibold">
                  {copy.privacy.legend}
                </legend>
                <p className="mt-1 mb-4 text-sm text-neutral-600">{copy.privacy.intro}</p>
                <div className="grid gap-5">
                  <VisibilitySelect
                    label={copy.privacy.email.label}
                    value={values.privacyEmail}
                    options={copy.privacy.email.options}
                    error={errors.privacyEmail}
                    onChange={(value) => update('privacyEmail', value)}
                  />
                  <VisibilitySelect
                    label={copy.privacy.phone.label}
                    value={values.privacyPhone}
                    options={copy.privacy.phone.options}
                    error={errors.privacyPhone}
                    onChange={(value) => update('privacyPhone', value)}
                  />
                  <VisibilitySelect
                    label={copy.privacy.profile.label}
                    value={values.privacyProfile}
                    options={copy.privacy.profile.options}
                    error={errors.privacyProfile}
                    onChange={(value) => update('privacyProfile', value)}
                  />
                </div>
              </fieldset>

              <FormField
                label={copy.consent.label}
                hint={copy.consent.hint}
                error={errors.consent}
                required
              >
                {(control) => (
                  <Checkbox
                    {...control}
                    checked={values.consent}
                    onCheckedChange={(checked) => update('consent', checked === true)}
                  />
                )}
              </FormField>

              <p className="text-sm text-neutral-600">
                Read the{' '}
                <Link href="/legal/terms" className="text-primary-700 underline">
                  terms of use
                </Link>{' '}
                and the{' '}
                <Link href="/legal/privacy" className="text-primary-700 underline">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          ) : null}
        </div>

        {submitError ? (
          <p
            role="alert"
            className="text-danger-600 border-danger-600/30 bg-danger-600/5 mt-4 rounded-lg border p-3 text-sm font-medium"
          >
            {submitError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={status === 'submitting'}
              className="h-11 px-5 text-base"
            >
              {copy.buttons.back}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            disabled={status === 'submitting'}
            className="h-11 px-6 text-base font-semibold"
          >
            {status === 'submitting'
              ? copy.buttons.submitting
              : step < REGISTER_STEPS.length - 1
                ? copy.buttons.next
                : copy.buttons.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
