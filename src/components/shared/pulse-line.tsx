import { cn } from '@/lib/utils';

/**
 * The site's medical motif: a single electrocardiogram waveform drawn in one stroke free
 * of the lead weight (that plain stretch is what makes ECG traces recognisable), ending in
 * the small deflection a heartbeat makes.
 *
 * An ECG is the one image every alumnus of a health-science institute shares, which is why
 * it reads as belonging here rather than as clip-art. It is an accent, not a texture: use
 * it inline beside an eyebrow or heading, at about half-em height, at most once or twice
 * per page. `fill="none"` plus `currentColor` keeps it token-driven through a text-* class.
 */
export function PulseLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 24"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={cn('h-4 w-24 shrink-0', className)}
    >
      {/* P wave, QRS spike, T wave: the classic three-beat shape on one baseline. */}
      <path
        d="M0 12h48q4-5 8 0l3 2l4-12l5 18l5-8q5-6 10 0H200"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
