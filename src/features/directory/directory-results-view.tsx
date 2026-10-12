import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

import { DonateLink } from '@/components/shared/donate-link';
import { EmptyState } from '@/components/shared/empty-state';
import { buttonVariants } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import { directoryPage } from '@/content/directory';
import { buildDirectoryHref } from '@/features/directory/build-directory-href';
import { getPageItems } from '@/features/directory/get-page-items';
import type { DirectoryParams } from '@/features/directory/parse-directory-params';
import { PersonCard } from '@/features/directory/person-card';
import type { Alumnus, Paginated } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type DirectoryResultsViewProps = {
  result: Paginated<Alumnus>;
  params: DirectoryParams;
};

/** Page links are real links (Next Link) styled like buttons. */
function PageNav({ result, params }: DirectoryResultsViewProps) {
  const totalPages = Math.ceil(result.total / result.pageSize);
  if (totalPages <= 1) return null;
  const href = (page: number) => buildDirectoryHref({ ...params, page });

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        {result.page > 1 ? (
          <PaginationItem>
            <Link
              href={href(result.page - 1)}
              aria-label="Go to previous page"
              className={cn(buttonVariants({ variant: 'ghost' }), 'h-11 px-3')}
            >
              <ChevronLeftIcon aria-hidden="true" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          </PaginationItem>
        ) : null}
        {getPageItems(result.page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <PaginationItem key={'gap-' + index}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <Link
                href={href(item)}
                aria-label={'Page ' + item}
                aria-current={item === result.page ? 'page' : undefined}
                className={cn(
                  buttonVariants({ variant: item === result.page ? 'outline' : 'ghost' }),
                  'size-11',
                )}
              >
                {item}
              </Link>
            </PaginationItem>
          ),
        )}
        {result.page < totalPages ? (
          <PaginationItem>
            <Link
              href={href(result.page + 1)}
              aria-label="Go to next page"
              className={cn(buttonVariants({ variant: 'ghost' }), 'h-11 px-3')}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon aria-hidden="true" />
            </Link>
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </Pagination>
  );
}

/** The result count, the person cards and the page links. Shows an empty state for no results. */
export function DirectoryResultsView({ result, params }: DirectoryResultsViewProps) {
  const { donateLink, empty, resultsLabel, sampleNote } = directoryPage;

  if (result.items.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title={empty.title}
        description={empty.description}
        action={
          <Link href="/directory" className={cn(buttonVariants({ variant: 'outline' }), 'h-11')}>
            {empty.clear}
          </Link>
        }
      />
    );
  }

  const start = (result.page - 1) * result.pageSize + 1;
  const end = start + result.items.length - 1;
  const sample = result.items.some((person) => person.placeholder);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-600">
          Showing {start}
          {'\u2013'}
          {end} of {result.total} alumni
        </p>
        <DonateLink href="/donate" className="hidden h-10 px-5 text-sm sm:inline-flex">
          {donateLink.label}
        </DonateLink>
      </div>
      <ul aria-label={resultsLabel} className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((person) => (
          <li key={person.id}>
            <PersonCard person={person} />
          </li>
        ))}
      </ul>
      <PageNav result={result} params={params} />
      {sample ? <p className="mt-6 text-sm text-neutral-600">{sampleNote}</p> : null}
    </div>
  );
}
