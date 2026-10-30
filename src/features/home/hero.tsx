import { Heart, type LucideIcon, Search, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { donateClassName } from '@/components/shared/donate-button';
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
        className="object-cover object-center"
      />
      <div aria-hidden="true" className="bg-primary-900/45 absolute inset-0" />
      <div
        aria-hidden="true"
        className="from-primary-900/85 via-primary-900/55 to-primary-900/25 absolute inset-0 bg-linear-to-r"
      />

      <Container className="relative flex min-h-[30rem] flex-col justify-center py-16 lg:min-h-[38rem] lg:py-24">
        <div className="max-w-3xl">
          <p className="text-eyebrow lg:text-eyebrow-lg text-primary-100 font-semibold tracking-[0.08em] uppercase">
            {hero.eyebrow}
          </p>
          <h1 id="hero-heading" className="font-heading mt-3 text-white">
            {hero.title}
          </h1>
          <p className="text-body-l text-primary-100 mt-4 max-w-2xl">{hero.mission}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {hero.ctas.map((cta) => {
              const Icon = icons[cta.key];
              return (
                <Link
                  key={cta.key}
                  href={cta.href}
                  className={cn(
                    buttonVariants(),
                    ctaBase,
                    cta.key === 'give' ? donateClassName : lightCta,
                  )}
                >
                  <Icon aria-hidden="true" />
                  {cta.label}
                </Link>
              );
            })}
          </div>
        </div>

        <p className="text-primary-100/80 mt-10 text-xs">
          <a
            href={hero.image.creditHref}
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-primary-100/40 underline underline-offset-2 hover:text-white"
          >
            {hero.image.credit}
          </a>
        </p>
      </Container>
    </section>
  );
}
