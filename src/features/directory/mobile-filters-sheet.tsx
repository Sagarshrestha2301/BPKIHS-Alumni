'use client';

import { SlidersHorizontalIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { directoryPage } from '@/content/directory';

type MobileFiltersSheetProps = { activeCount: number; children: ReactNode };

/** A "Filters" button that opens the filter form in a bottom sheet. Shown below 1024 px. */
export function MobileFiltersSheet({ activeCount, children }: MobileFiltersSheetProps) {
  const copy = directoryPage.filters;

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" className="h-11 w-full" />}>
        <SlidersHorizontalIcon aria-hidden="true" />
        {copy.open}
        {activeCount > 0 ? ' (' + activeCount + ')' : ''}
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
