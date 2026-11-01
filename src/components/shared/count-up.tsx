'use client';

import { useEffect, useRef, useState } from 'react';

import { formatNprCompact } from '@/lib/format/money';
import { cn } from '@/lib/utils';

type FormatKind = 'plain' | 'nprCompact';

/**
 * Editorial number ticker that starts from zero, increases when the user scrolls,
 * stops at the current value, and dynamically resets whenever scrolled out of view
 * (no permanent lock).
 *
 * Interaction design:
 * 1. Primed at zero: In the browser, figures start at 0 so the visitor watches them count up.
 * 2. Scroll activation: Waits until the visitor scrolls into view so numbers never complete
 *    prematurely while reading the hero.
 * 3. High-velocity exponential easing: Surges rapidly through ~71% in the first 25% of the
 *    timeline, then glides through single digits into the exact current value.
 * 4. No permanent lock: Stops at the current target (88, NPR 7,500, 11, 13) while visible,
 *    and dynamically resets when the visitor scrolls back to the top or past the section,
 *    allowing the animation to re-trigger naturally on every re-entry.
 * 5. Tactile micro-settle: Triggers a 1.04x spring settle on arrival.
 * 6. SSR & test resilience: Headless environments and SSR render the final number immediately.
 */
const KIND_FORMATTERS: Record<FormatKind, (value: number) => string> = {
  plain: (value) => new Intl.NumberFormat('en-IN').format(value),
  nprCompact: (value) => formatNprCompact(value),
};

const DEFAULT_DURATION_MS = 1_200;

function easeOutHighVelocity(t: number): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const k = 7;
  const denom = 1 - Math.pow(2, -k);
  return (1 - Math.pow(2, -k * t)) / denom;
}

export type CountUpProps = {
  end: number;
  kind?: FormatKind;
  /** Stagger delay in milliseconds before this counter begins its ascent. */
  delay?: number;
  duration?: number;
  className?: string;
};

export function CountUp({
  end,
  kind = 'plain',
  delay = 0,
  duration = DEFAULT_DURATION_MS,
  className,
}: CountUpProps) {
  const format = KIND_FORMATTERS[kind];
  // SSR and JSDOM initialize to format(end) so search engines, screen readers,
  // and headless tests receive the final authoritative number immediately.
  const [display, setDisplay] = useState(() => format(end));
  const [isSettled, setIsSettled] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // In headless test environments (JSDOM where IntersectionObserver doesn't exist),
    // keep the initial formatted end value so tests pass synchronously.
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    let cancelled = false;
    let hasStarted = false;
    let frameId = 0;
    let primeFrame = 0;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let currentVal = 0;

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (primeFrame) cancelAnimationFrame(primeFrame);
      if (delayTimer) clearTimeout(delayTimer);
      frameId = 0;
      primeFrame = 0;
      delayTimer = null;
    };

    // Prime to 0 on initial client render. Deferred one frame so the effect body
    // never calls setState synchronously, and batched with the animation's own
    // first step so the final value is never painted instead of zero.

    // Smoothly animates the number from 0 up to end, then stops firmly at current value
    const startCountAnimation = () => {
      if (hasStarted || cancelled) return;
      hasStarted = true;

      const startedAt = performance.now();

      const step = (now: number) => {
        if (cancelled) return;
        const elapsed = now - startedAt;
        const p = Math.min(1, elapsed / duration);
        const eased = easeOutHighVelocity(p);
        const nextVal = Math.round(eased * end);

        currentVal = Math.min(end, Math.max(currentVal, nextVal));
        setDisplay(format(currentVal));

        if (p < 1 && currentVal < end) {
          frameId = requestAnimationFrame(step);
        } else {
          setDisplay(format(end));
          setIsSettled(true);
        }
      };

      frameId = requestAnimationFrame(step);
    };

    primeFrame = requestAnimationFrame(() => {
      if (!cancelled && !hasStarted) setDisplay(format(0));
    });

    const triggerAnimation = () => {
      if (hasStarted || cancelled) return;
      if (delay > 0) {
        if (!delayTimer) {
          delayTimer = setTimeout(startCountAnimation, delay);
        }
      } else {
        startCountAnimation();
      }
    };

    // When scrolled out of view or back to top: do NOT permanently lock. Reset so it re-animates.
    const resetAnimation = () => {
      stop();
      hasStarted = false;
      currentVal = 0;
      setIsSettled(false);
      setDisplay(format(0));
    };

    const checkTrigger = () => {
      if (cancelled) return;

      // If user scrolls all the way back up to top (Hero banner), reset so scrolling down triggers again
      if (window.scrollY === 0) {
        if (hasStarted) {
          resetAnimation();
        }
        return;
      }

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisibleInViewport = rect.top < windowHeight && rect.bottom > 0;

      if (isVisibleInViewport) {
        triggerAnimation();
      } else {
        // Scrolled away: reset so next scroll into view animates again
        if (hasStarted) {
          resetAnimation();
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            checkTrigger();
          } else {
            // When leaving viewport, reset so it is not permanently locked
            if (hasStarted) {
              resetAnimation();
            }
          }
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      },
    );

    observer.observe(element);
    window.addEventListener('scroll', checkTrigger, { passive: true });
    window.addEventListener('resize', checkTrigger, { passive: true });

    // Initial check
    checkTrigger();

    return () => {
      cancelled = true;
      stop();
      window.removeEventListener('scroll', checkTrigger);
      window.removeEventListener('resize', checkTrigger);
      observer.disconnect();
    };
  }, [delay, duration, end, format]);

  return (
    <span
      ref={elementRef}
      data-settled={isSettled ? 'true' : 'false'}
      className={cn(
        'inline-block tracking-tight tabular-nums transition-transform',
        isSettled && 'motion-safe:animate-counter-settle',
        className,
      )}
    >
      {display}
    </span>
  );
}
