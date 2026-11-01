import { cn } from '@/lib/utils';

/**
 * The site's one decorative motif: a stepped Himalayan ridgeline drawn as a flat
 * silhouette. The steps also echo the double pennant of the Nepal flag, which is why
 * the shape reads as local rather than as a generic mountain clip-art.
 *
 * It is decoration with a job: placed at the seam between the hero and the section
 * below, it fills itself with the next section's background colour, so the two bands
 * join like one landscape instead of two stacked blocks. `fill="currentColor"` keeps
 * it token-driven: the colour is whatever the parent sets via a text-* class.
 *
 * Keep it to one or two appearances per page. A motif scattered everywhere stops
 * being a motif and becomes pattern wallpaper.
 */
export function RidgeMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn('block h-9 w-full lg:h-12', className)}
    >
      <path
        fill="currentColor"
        d="M0 48 L0 30 L88 30 L132 18 L244 18 L288 28 L424 28 L470 12 L626 12
           L672 24 L858 24 L905 8 L1082 8 L1128 20 L1288 20 L1333 30 L1440 30 L1440 48 Z"
      />
    </svg>
  );
}
