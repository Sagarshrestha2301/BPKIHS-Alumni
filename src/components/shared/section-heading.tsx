import type { ReactNode } from 'react';

import { Eyebrow } from '@/components/shared/eyebrow';
import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Heading level. Use h1 once per page, h2 for sections. */
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  /**
   * A small decorative stroke rendered after the eyebrow text (the site's ECG `PulseLine`).
   * Decoration with a job: it darkens the one section the page is currently asking from,
   * so it belongs on the giving section, nowhere else.
   */
  accent?: ReactNode;
  className?: string;
};

export function SectionHeading({
  title,
  eyebrow,
  description,
  as: Heading = 'h2',
  align = 'left',
  accent,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn('max-w-3xl space-y-3', align === 'center' && 'mx-auto text-center', className)}
    >
      {eyebrow ? (
        <Eyebrow className="flex flex-wrap items-center gap-x-3">
          {eyebrow}
          {accent ? <span className="text-accent-500">{accent}</span> : null}
        </Eyebrow>
      ) : null}
      <Heading>{title}</Heading>
      {description ? (
        <p className="text-body-l leading-relaxed text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
