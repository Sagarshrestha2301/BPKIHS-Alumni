import { Heart, type LucideIcon, Search, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { donateClassName } from '@/components/shared/donate-button';
import { RidgeMotif } from '@/components/shared/ridge-motif';
import { buttonVariants } from '@/components/ui/button';
import { hero } from '@/content/home';
import { cn } from '@/lib/utils';

type CtaKey = (typeof hero.ctas)[number]['key'];

const icons: Record<CtaKey, LucideIcon> = { give: Heart, find: Search, join: UserPlus };

/** All three buttons share one size, so no path looks more important than another. */
const ctaBase =
  'h-12 w-full px-6 text-base font-semibold focus-visible:border-white focus-visible:ring-white/80 sm:w-auto';
const lightCta = 'bg-white text-primary-900 hover:bg-primary-100 active:bg-primary-100';

/**
 * The hero is a real photograph of the campus under two navy layers: a flat wash that keeps the
 * whole band readable, and a left-to-right gradient that is almost opaque behind the copy and
 * lets the campus show through on the right. Text never sits on the photograph itself, so the
 * contrast does not depend on which part of the image happens to be bright.
 *
 * The band closes on the site's one expressive landmark: the stepped ridge motif (Nepal's
 * double pennant and the approach to Dharan) drawn in the stats band's own tint, so the seam
 * reads as one landscape rather than two stacked blocks. Everything below the hero stays quiet.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-primary-900 relative isolate overflow-hidden text-white"
    >
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        preload
        sizes="100vw"
        className="object-cover object-center transition-transform duration-1000 motion-safe:scale-[1.01]"
      />
      {/* Layered atmospheric lighting: Dharan navy deep gradient + ambient radial glow */}
      <div
        aria-hidden="true"
        className="bg-primary-900/50 absolute inset-0 backdrop-brightness-95"
      />
      <div
        aria-hidden="true"
        className="from-primary-900/95 via-primary-900/65 to-primary-900/30 absolute inset-0 bg-linear-to-r"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(42,107,176,0.22),transparent)]"
      />

      <Container className="relative flex min-h-[32rem] flex-col justify-center py-20 pb-40 lg:min-h-[42rem] lg:py-28 lg:pb-48">
        <div className="animate-viewport-in max-w-3xl">
          <p className="text-eyebrow lg:text-eyebrow-lg text-primary-100 flex flex-wrap items-baseline gap-x-3 font-semibold tracking-[0.08em] uppercase">
            {hero.eyebrow}
            {/* Light Devanagari accent: the place, in Nepali. `lang` routes it to the Devanagari face. */}
            <span lang="ne" className="font-devanagari tracking-normal opacity-90">
              {hero.locationNe}
            </span>
          </p>
          <h1
            id="hero-heading"
            className="font-heading mt-3 text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
          >
            {hero.title}
          </h1>
          <p className="text-body-l text-primary-100/95 mt-5 max-w-2xl leading-relaxed">
            {hero.mission}
          </p>
          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
            {hero.ctas.map((cta) => {
              const Icon = icons[cta.key];
              return (
                <Link
                  key={cta.key}
                  href={cta.href}
                  className={cn(
                    buttonVariants(),
                    ctaBase,
                    'btn-press shadow-xs transition-all duration-180 hover:shadow-md',
                    cta.key === 'give' ? donateClassName : lightCta,
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="transition-transform duration-180 group-hover:scale-110"
                  />
                  {cta.label}
                </Link>
              );
            })}
          </div>
        </div>

        <p className="text-primary-100/75 mt-12 text-xs">
          <a
            href={hero.image.creditHref}
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-primary-100/40 underline underline-offset-2 transition-colors hover:text-white"
          >
            {hero.image.credit}
          </a>
        </p>

        {/* Elegant scroll hint towards the community statistics */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 opacity-60 lg:flex"
        >
          <span className="text-primary-100 text-[10px] font-semibold tracking-widest uppercase">
            Scroll
          </span>
          <div className="border-primary-100/40 h-6 w-3.5 rounded-full border p-0.5">
            <div className="bg-primary-100 mx-auto size-1 animate-bounce rounded-full" />
          </div>
        </div>
      </Container>

      {/* Seam into the stats band: fills with its `bg-secondary` tint via `currentColor`. */}
      <RidgeMotif className="text-secondary absolute inset-x-0 bottom-0 z-10" />
    </section>
  );
}
