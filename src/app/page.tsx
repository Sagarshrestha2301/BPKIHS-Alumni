import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10">
      <p className="text-sm font-semibold tracking-wide text-sky-800">
        BPKIHS Alumni Association
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
        The official home for BPKIHS alumni.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
        Build and maintain your alumni identity, reconnect with the community,
        and take part in Association initiatives.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="rounded-md bg-sky-800 px-5 py-3 font-medium text-white hover:bg-sky-900"
          href="/sign-up"
        >
          Create an account
        </Link>
        <Link
          className="rounded-md border border-slate-300 px-5 py-3 font-medium text-slate-800 hover:bg-slate-100"
          href="/sign-in"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-12 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        The alumni directory, staff verification review, events, and donation
        features will be released after the Association confirms the remaining
        policy decisions.
      </p>
    </main>
  );
}
