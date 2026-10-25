'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState, useSyncExternalStore } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Stepper } from '@/components/shared/stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { donateCheckoutPage } from '@/content/donate';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { type ApiClient, getApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { loginSchema, signupSchema, type TributeInput } from '@/lib/api/schemas';
import type { DonationGoal } from '@/lib/api/types';
import { MAX_DONATION_MINOR, MIN_DONATION_MINOR } from '@/lib/constants/domain';
import { formatNpr } from '@/lib/format/money';
import { cn } from '@/lib/utils';

const inputClass = 'h-11 bg-white';

/** Only gateways with a working adapter are offered. */
const AVAILABLE_METHODS = ['esewa', 'khalti'] as const;
type AvailableMethod = (typeof AVAILABLE_METHODS)[number];

const subscribe = () => () => {};

/**
 * The checkout is client-side only. Before hydration a submit would trigger a native form
 * submission and throw away the donor's progress, so the buttons stay disabled until React
 * has taken over.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

type Props = {
  goal: DonationGoal;
  initialAmountMinor: number;
  tribute?: TributeInput;
  client?: ApiClient;
};

function paymentMethodLabel(method: AvailableMethod): string {
  return donateCheckoutPage.payment.methods[method].label;
}

function Summary({
  goal,
  amountMinor,
  step,
}: {
  goal: DonationGoal;
  amountMinor: number;
  step: number;
}) {
  const copy = donateCheckoutPage.summary;
  return (
    <aside
      aria-label={copy.title}
      className="h-fit rounded-xl border border-neutral-300 bg-white p-6 shadow-sm lg:sticky lg:top-24"
    >
      <h2 className="font-heading text-primary-900 text-xl font-semibold">{copy.title}</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-600">{copy.goal}</dt>
          <dd className="text-right font-medium text-neutral-900">{goal.title}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-600">{copy.amount}</dt>
          <dd className="font-medium text-neutral-900">{formatNpr(amountMinor)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-600">{copy.fee}</dt>
          <dd className="text-right text-neutral-600">{copy.feeValue}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-neutral-300 pt-3 text-base">
          <dt className="font-semibold text-neutral-900">{copy.total}</dt>
          <dd className="text-primary-900 font-semibold">{formatNpr(amountMinor)}</dd>
        </div>
      </dl>
      {step > 0 ? <p className="mt-4 text-xs text-neutral-600">Step {step + 1} of 3</p> : null}
    </aside>
  );
}

function CheckoutFlow({ goal, initialAmountMinor, tribute, client }: Props) {
  const copy = donateCheckoutPage;
  const router = useRouter();
  const api = client ?? getApiClient();
  const auth = useAuth();
  const hydrated = useHydrated();
  const [step, setStep] = useState(0);
  const [amountInput, setAmountInput] = useState(String(initialAmountMinor / 100));
  const [amountError, setAmountError] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [method, setMethod] = useState<AvailableMethod | ''>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const amountMinor = Math.round(Number(amountInput) * 100);
  const amountValid =
    Number.isInteger(amountMinor) &&
    amountMinor >= MIN_DONATION_MINOR &&
    amountMinor <= MAX_DONATION_MINOR;

  function continueFromAmount(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!amountValid) {
      setAmountError(copy.errors.amount);
      return;
    }
    setAmountError(null);
    setStep(auth.session ? 2 : 1);
  }

  async function signIn(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    });
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? copy.errors.account);
      return;
    }
    setSubmitError(null);
    const session = await auth.signIn(parsed.data);
    if (session) setStep(2);
  }

  async function signUp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: String(form.get('fullName') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      password: String(form.get('password') ?? ''),
    });
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? copy.errors.account);
      return;
    }
    setSubmitError(null);
    const session = await auth.signUp(parsed.data);
    if (session) setStep(2);
  }

  async function completeGift(): Promise<void> {
    if (submitting) return;
    if (!method) {
      setPaymentError(copy.errors.payment);
      return;
    }
    setPaymentError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await api.createDonation({
        goalId: goal.id,
        amountMinor,
        currency: 'NPR',
        method,
        anonymous,
        ...(tribute ? { tribute } : {}),
      });
      if (result.status === 'failed') {
        setSubmitError(copy.errors.submit);
        setSubmitting(false);
        return;
      }
      if (result.redirect) {
        if (result.redirect.method === 'GET') {
          window.location.assign(result.redirect.url);
          return;
        }
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.redirect.url;
        for (const [name, value] of Object.entries(result.redirect.fields ?? {})) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }
      const params = new URLSearchParams({
        id: result.donationId,
        status: result.status,
        amount: String(amountMinor),
        goal: goal.title,
        method: paymentMethodLabel(method),
      });
      router.push(`/donate/thank-you?${params.toString()}`);
    } catch (error) {
      setSubmitError(isApiError(error) ? error.message : copy.errors.submit);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Stepper steps={copy.steps} currentIndex={step} className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm md:p-8">
          {step === 0 ? (
            <form onSubmit={continueFromAmount} noValidate>
              <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                {copy.amount.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                {copy.amount.goalLabel}: <span className="font-medium">{goal.title}</span>
              </p>
              <Link href="/donate" className="text-primary-700 mt-2 inline-block text-sm underline">
                Change goal
              </Link>

              <div className="mt-6 grid gap-5">
                <FormField
                  label={copy.amount.amountLabel}
                  hint={copy.amount.amountHint}
                  error={amountError ?? undefined}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      type="number"
                      inputMode="numeric"
                      min={MIN_DONATION_MINOR / 100}
                      max={MAX_DONATION_MINOR / 100}
                      step={1}
                      value={amountInput}
                      onChange={(event) => {
                        setAmountInput(event.target.value);
                        setAmountError(null);
                      }}
                      className={inputClass}
                    />
                  )}
                </FormField>

                <div className="flex flex-wrap gap-2">
                  {[1000, 2500, 5000, 10000, 25000].map((rupees) => (
                    <button
                      key={rupees}
                      type="button"
                      onClick={() => {
                        setAmountInput(String(rupees));
                        setAmountError(null);
                      }}
                      className="hover:border-primary-700 hover:bg-primary-100 rounded-full border border-neutral-500 px-4 py-2 text-sm font-medium"
                    >
                      {formatNpr(rupees * 100)}
                    </button>
                  ))}
                </div>

                <label className="flex min-h-11 items-center gap-3">
                  <Switch
                    checked={anonymous}
                    onCheckedChange={(checked) => setAnonymous(checked === true)}
                  />
                  <span>
                    <span className="block font-medium text-neutral-900">
                      {copy.amount.anonymousLabel}
                    </span>
                    <span className="block text-sm text-neutral-600">
                      {copy.amount.anonymousHint}
                    </span>
                  </span>
                </label>

                {tribute ? (
                  <div className="border-primary-100 bg-primary-100/50 rounded-lg border p-4 text-sm">
                    <p className="text-primary-900 font-semibold">
                      {tribute.type === 'in_memory' ? 'In memory' : 'In honour'} of {tribute.name}
                    </p>
                    {tribute.message ? (
                      <p className="mt-1 text-neutral-600">{tribute.message}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  type="submit"
                  // Wait for the restored session too, not just hydration: deciding while it is
                  // still loading would show a signed-in donor the sign-in form.
                  disabled={!hydrated || auth.status === 'loading'}
                  className="h-11 px-6 text-base font-semibold"
                >
                  {copy.buttons.continue}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                {copy.account.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-600">{copy.account.description}</p>

              {auth.session ? (
                <div className="mt-6">
                  <p className="text-neutral-900">
                    Signed in as <span className="font-semibold">{auth.session.email}</span>.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="mt-6 h-11 px-6 text-base font-semibold"
                  >
                    {copy.buttons.continue}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-6 flex gap-2">
                    {(['signin', 'signup'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setAuthMode(mode);
                          setSubmitError(null);
                          auth.clearError();
                        }}
                        className={cn(
                          'h-10 rounded-lg px-4 text-sm font-semibold',
                          authMode === mode
                            ? 'bg-primary-700 text-white'
                            : 'border border-neutral-500 text-neutral-900',
                        )}
                      >
                        {mode === 'signin' ? copy.account.signInTitle : copy.account.signUpTitle}
                      </button>
                    ))}
                  </div>

                  {authMode === 'signin' ? (
                    <form onSubmit={signIn} noValidate className="mt-6 grid gap-5">
                      <FormField label={copy.account.emailLabel} required>
                        {(control) => (
                          <Input
                            {...control}
                            name="email"
                            type="email"
                            autoComplete="email"
                            className={inputClass}
                          />
                        )}
                      </FormField>
                      <FormField label={copy.account.passwordLabel} required>
                        {(control) => (
                          <Input
                            {...control}
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            className={inputClass}
                          />
                        )}
                      </FormField>
                      <Button
                        type="submit"
                        disabled={!hydrated || auth.status === 'loading'}
                        className="h-11 px-6 text-base font-semibold"
                      >
                        {copy.account.signInButton}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={signUp} noValidate className="mt-6 grid gap-5">
                      <FormField label={copy.account.nameLabel} required>
                        {(control) => (
                          <Input
                            {...control}
                            name="fullName"
                            autoComplete="name"
                            className={inputClass}
                          />
                        )}
                      </FormField>
                      <FormField label={copy.account.emailLabel} required>
                        {(control) => (
                          <Input
                            {...control}
                            name="email"
                            type="email"
                            autoComplete="email"
                            className={inputClass}
                          />
                        )}
                      </FormField>
                      <FormField label={copy.account.phoneLabel}>
                        {(control) => (
                          <Input
                            {...control}
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            className={inputClass}
                          />
                        )}
                      </FormField>
                      <FormField
                        label={copy.account.passwordLabel}
                        required
                        hint={copy.account.passwordHint}
                      >
                        {(control) => (
                          <Input
                            {...control}
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            className={inputClass}
                          />
                        )}
                      </FormField>
                      <Button
                        type="submit"
                        disabled={!hydrated || auth.status === 'loading'}
                        className="h-11 px-6 text-base font-semibold"
                      >
                        {copy.account.signUpButton}
                      </Button>
                    </form>
                  )}
                  <p className="mt-4 text-xs text-neutral-600">{copy.account.note}</p>
                </>
              )}

              {auth.error ? (
                <p role="alert" className="text-danger-600 mt-4 text-sm font-medium">
                  {auth.error.message}
                </p>
              ) : null}
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="h-11 px-5"
                >
                  {copy.buttons.back}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="font-heading text-primary-900 text-2xl font-semibold">
                {copy.payment.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-600">{copy.payment.description}</p>

              <fieldset className="mt-6">
                <legend className="text-primary-900 mb-3 text-base font-semibold">
                  {copy.payment.national}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {AVAILABLE_METHODS.map((value) => {
                    const item = copy.payment.methods[value];
                    return (
                      <label
                        key={value}
                        className={cn(
                          'flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3',
                          method === value
                            ? 'border-primary-700 bg-primary-100/50'
                            : 'border-neutral-300 bg-white',
                        )}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={value}
                          checked={method === value}
                          onChange={() => {
                            setMethod(value);
                            setPaymentError(null);
                          }}
                          className="accent-primary-700 mt-1 size-4"
                        />
                        <span>
                          <span className="block font-medium text-neutral-900">{item.label}</span>
                          <span className="block text-sm text-neutral-600">{item.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {method ? (
                <p className="mt-4 rounded-lg border border-neutral-300 bg-neutral-100/60 p-4 text-sm text-neutral-600">
                  {copy.payment.redirectNote}
                </p>
              ) : null}

              {paymentError ? (
                <p role="alert" className="text-danger-600 mt-3 text-sm font-medium">
                  {paymentError}
                </p>
              ) : null}
              {submitError ? (
                <p role="alert" className="text-danger-600 mt-3 text-sm font-medium">
                  {submitError}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(auth.session ? 0 : 1)}
                  disabled={submitting}
                  className="h-11 px-5"
                >
                  {copy.buttons.back}
                </Button>
                <Button
                  type="button"
                  onClick={completeGift}
                  disabled={!hydrated || submitting}
                  className="h-11 px-6 text-base font-semibold"
                >
                  {submitting ? copy.buttons.paying : copy.buttons.pay}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <Summary goal={goal} amountMinor={amountValid ? amountMinor : 0} step={step} />
      </div>

      <p className="mt-6 text-center text-sm text-neutral-600">
        <Link href="/donate" className="text-primary-700 underline">
          Back to all giving goals
        </Link>
      </p>
    </div>
  );
}

export function CheckoutExperience(props: Props) {
  return (
    <AuthProvider client={props.client}>
      <CheckoutFlow {...props} />
    </AuthProvider>
  );
}
