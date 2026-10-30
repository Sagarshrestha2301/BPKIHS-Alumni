import Link from 'next/link';

import { directoryPage } from '@/content/directory';

/** A quiet banner for signed-out visitors: public profiles are open, member details are not. */
export function GuestNote({ next }: { next: string }) {
  const copy = directoryPage.guestNote;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-neutral-300 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-neutral-700">{copy.text}</p>
      <div className="flex shrink-0 items-center gap-4 text-sm font-medium">
        <Link
          href={`/sign-in?next=${encodeURIComponent(next)}`}
          className="text-primary-700 underline"
        >
          {copy.signIn}
        </Link>
        <Link href="/register" className="text-primary-700 underline">
          {copy.register}
        </Link>
      </div>
    </div>
  );
}
