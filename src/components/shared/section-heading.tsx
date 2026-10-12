import { Eyebrow } from '@/components/shared/eyebrow';
import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Heading level. Use h1 once per page, h2 for sections. */
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({
  title,
  eyebrow,
  description,
  as: Heading = 'h2',
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn('max-w-3xl space-y-3', align === 'center' && 'mx-auto text-center', className)}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading>{title}</Heading>
      {description ? (
        <p className="text-body-l leading-relaxed text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
