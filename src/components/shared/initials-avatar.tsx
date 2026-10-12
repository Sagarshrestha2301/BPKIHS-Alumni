import { cn } from '@/lib/utils';

const TITLES = new Set(['dr', 'dr.', 'prof', 'prof.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.']);

/** "Dr. Sita Rai" gives "SR". One-word names give one letter. */
export function getInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !TITLES.has(word.toLowerCase()));
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** A round avatar with initials. The name is always printed next to it, so it is hidden from screen readers. */
export function InitialsAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-primary-100 text-primary-900 font-heading flex shrink-0 items-center justify-center rounded-full font-bold',
        size === 'lg' ? 'size-20 text-2xl' : 'size-16 text-xl',
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
