import { XIcon } from 'lucide-react';
import Link from 'next/link';

import { directoryPage } from '@/content/directory';
import { getActiveFilters, getClearFiltersHref } from '@/features/directory/get-active-filters';
import type { DirectoryParams } from '@/features/directory/parse-directory-params';

/** Removable chips for the filters that are set. Renders nothing when none are. */
export function ActiveFilterChips({ params }: { params: DirectoryParams }) {
  const active = getActiveFilters(params);
  if (active.length === 0) return null;
  const copy = directoryPage.filters;

  return (
    <ul aria-label={copy.activeLabel} className="mt-8 flex flex-wrap items-center gap-2">
      {active.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            aria-label={copy.remove + ': ' + item.label}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-500 bg-white px-3 text-sm text-neutral-900 hover:bg-neutral-100"
          >
            {item.label}
            <XIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={getClearFiltersHref(params)}
          className="text-primary-700 inline-flex h-9 items-center px-2 text-sm font-medium underline underline-offset-4"
        >
          {copy.clearAll}
        </Link>
      </li>
    </ul>
  );
}
