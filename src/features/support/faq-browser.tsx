'use client';

import { Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { faqPage } from '@/content/support';
import type { FaqItem } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function FaqBrowser({ items }: { items: FaqItem[] }) {
  const copy = faqPage;
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(copy.all);
  const categories = useMemo(
    () => [copy.all, ...Array.from(new Set(items.map((item) => item.category)))],
    [items, copy.all],
  );

  const filtered = items.filter((item) => {
    if (category !== copy.all && item.category !== category) return false;
    const haystack = `${item.question} ${item.answer} ${item.category}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full max-w-md">
          <label htmlFor={searchId} className="text-primary-900 mb-2 block font-medium">
            {copy.searchLabel}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-600"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="h-11 bg-white pl-9"
            />
          </div>
        </div>
      </div>

      <div role="group" aria-label={copy.categoriesLabel} className="mt-5 flex flex-wrap gap-2">
        {categories.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
            className={cn(
              'min-h-10 rounded-full border px-4 text-sm font-medium',
              category === value
                ? 'border-primary-700 bg-primary-700 text-white'
                : 'hover:bg-primary-100 border-neutral-500 text-neutral-900',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-neutral-100 p-8 text-center text-neutral-600">
          {copy.empty}
        </p>
      ) : (
        <Accordion className="mt-6 rounded-xl border border-neutral-300 bg-white px-6">
          {filtered.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-primary-900 min-h-12 items-center py-4 text-base font-semibold">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-neutral-600">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
