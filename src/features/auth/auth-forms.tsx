"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

type FormStatus = {
  error: string | null;
  isPending: boolean;
};

function FormMessage({ error }: Pick<FormStatus, "error">) {
  if (!error) {
    return null;
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      role="alert"
    >
      {error}
    </p>
  );
}

function SubmitButton({
  children,
  isPending,
}: {
  children: string;
  isPending: boolean;
}) {
  return (
    <button
      className="rounded-md bg-sky-800 px-4 py-2 font-medium text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      type="submit"
    >
      {isPending ? "Please wait…" : children}
    </button>
  );
}

function AuthShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="mb-2 text-sm font-semibold tracking-wide text-sky-800">
        BPKIHS Alumni Association
      </p>
      <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
      <p className="mt-3 text-slate-600">{description}</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({
    error: null,
    isPending: false,
  });

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setStatus({ error: null, isPending: true });
    const result = await authClient.signUp.email({ name, email, password });

    if (result.error) {
      setStatus({
        error: result.error.message ?? "We could not create your account.",
        isPending: false,
      });
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthShell
      description="Use an email address you control. You will verify it before signing in."
      title="Create your account"
    >
      <form className="space-y-4" onSubmit={submitHandler}>
        <label className="block text-sm font-medium text-slate-800" htmlFor="name">
          Full name
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="name"
            minLength={2}
            name="name"
            required
            type="text"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="email"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800" htmlFor="password">
          Password
          <input
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <FormMessage error={status.error} />
        <SubmitButton isPending={status.isPending}>Create account</SubmitButton>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Already registered?{" "}
        <Link className="font-medium text-sky-800 underline" href="/sign-in">
          Sign in
        </Link>
        .
      </p>
    </AuthShell>
  );
}

export function VerifyEmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({
    error: null,
    isPending: false,
  });

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const otp = String(formData.get("otp") ?? "").trim();

    setStatus({ error: null, isPending: true });
    const result = await authClient.emailOtp.verifyEmail({ email, otp });

    if (result.error) {
      setStatus({
        error: result.error.message ?? "That code could not be verified.",
        isPending: false,
      });
      return;
    }

    router.push("/sign-in?verified=1");
  }

  return (
    <AuthShell
      description="Enter the six-digit code we sent to your email address. The code expires after five minutes."
      title="Verify your email"
    >
      <form className="space-y-4" onSubmit={submitHandler}>
        <label className="block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={initialEmail}
            id="email"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800" htmlFor="otp">
          Verification code
          <input
            autoComplete="one-time-code"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 tracking-[0.35em]"
            id="otp"
            inputMode="numeric"
            maxLength={6}
            name="otp"
            pattern="[0-9]{6}"
            required
            type="text"
          />
        </label>
        <FormMessage error={status.error} />
        <SubmitButton isPending={status.isPending}>Verify email</SubmitButton>
      </form>
    </AuthShell>
  );
}

export function SignInForm({ isVerified }: { isVerified: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({
    error: null,
    isPending: false,
  });

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setStatus({ error: null, isPending: true });
    const result = await authClient.signIn.email({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });

    if (result.error) {
      setStatus({
        error: result.error.message ?? "Your email or password is incorrect.",
        isPending: false,
      });
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell description="Access your BPKIHS Alumni account." title="Sign in">
      {isVerified ? (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Your email has been verified. You can now sign in.
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={submitHandler}>
        <label className="block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="email"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800" htmlFor="password">
          Password
          <input
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="password"
            name="password"
            required
            type="password"
          />
        </label>
        <FormMessage error={status.error} />
        <SubmitButton isPending={status.isPending}>Sign in</SubmitButton>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        <Link className="font-medium text-sky-800 underline" href="/forgot-password">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-3 text-sm text-slate-600">
        New here?{" "}
        <Link className="font-medium text-sky-800 underline" href="/sign-up">
          Create an account
        </Link>
        .
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({
    error: null,
    isPending: false,
  });

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    setStatus({ error: null, isPending: true });
    const result = await authClient.emailOtp.requestPasswordReset({ email });

    if (result.error) {
      setStatus({
        error: result.error.message ?? "We could not send a reset code.",
        isPending: false,
      });
      return;
    }

    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthShell
      description="We will email you a one-time code to set a new password."
      title="Reset your password"
    >
      <form className="space-y-4" onSubmit={submitHandler}>
        <label className="block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="email"
            name="email"
            required
            type="email"
          />
        </label>
        <FormMessage error={status.error} />
        <SubmitButton isPending={status.isPending}>Email reset code</SubmitButton>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        <Link className="font-medium text-sky-800 underline" href="/sign-in">
          Return to sign in
        </Link>
        .
      </p>
    </AuthShell>
  );
}

export function ResetPasswordForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<FormStatus>({
    error: null,
    isPending: false,
  });

  async function submitHandler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const otp = String(formData.get("otp") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setStatus({ error: null, isPending: true });
    const result = await authClient.emailOtp.resetPassword({ email, otp, password });

    if (result.error) {
      setStatus({
        error: result.error.message ?? "We could not reset your password.",
        isPending: false,
      });
      return;
    }

    router.push("/sign-in");
  }

  return (
    <AuthShell
      description="Enter the reset code from your email and choose a new password."
      title="Choose a new password"
    >
      <form className="space-y-4" onSubmit={submitHandler}>
        <label className="block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
          <input
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            defaultValue={initialEmail}
            id="email"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800" htmlFor="otp">
          Reset code
          <input
            autoComplete="one-time-code"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 tracking-[0.35em]"
            id="otp"
            inputMode="numeric"
            maxLength={6}
            name="otp"
            pattern="[0-9]{6}"
            required
            type="text"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800" htmlFor="password">
          New password
          <input
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <FormMessage error={status.error} />
        <SubmitButton isPending={status.isPending}>Save new password</SubmitButton>
      </form>
    </AuthShell>
  );
}
