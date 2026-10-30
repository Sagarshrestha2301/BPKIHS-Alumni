import { SearchIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** A 404 is answered with a 404 status anyway; the tag says it plainly for any crawler. */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

const links = [
  { label: 'Home', href: '/' },
  { label: 'Alumni directory', href: '/directory' },
  { label: 'Events', href: '/events' },
];

export default function NotFound() {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-primary-700 text-sm font-semibold tracking-wider uppercase">Error 404</p>
        <h1 className="mt-3">We could not find that page</h1>
        <p className="mt-4 text-lg text-neutral-600">
          The page may have moved, or the link may be wrong. Search for an alumnus, or go to one of
          these pages.
        </p>
        <form action="/directory" role="search" className="mt-8 text-left">
          <Label htmlFor="not-found-search" className="text-primary-900 mb-2 block font-medium">
            Search the alumni directory
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="not-found-search"
              name="q"
              type="search"
              placeholder="Name, specialisation or country"
              className="h-11"
            />
            <Button type="submit" className="h-11 px-5">
              <SearchIcon aria-hidden="true" />
              Search
            </Button>
          </div>
        </form>
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-5 text-sm')}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
