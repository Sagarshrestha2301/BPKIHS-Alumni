import type { ReactNode } from 'react';

/**
 * Every dashboard screen opens the same way: one heading, one plain-English sentence about
 * what the screen is for, and the actions that belong to it. Keeping this in one component
 * is why the pages below it can stay about their job.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-300 pb-6">
      <div className="max-w-3xl min-w-0">
        <h1 className="font-heading text-primary-900 text-2xl font-semibold sm:text-3xl">
          {title}
        </h1>
        {description ? <p className="mt-2 text-neutral-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
