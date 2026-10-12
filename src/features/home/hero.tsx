import { Heart, type LucideIcon, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
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

export function Hero() {
  return (
    <Section
      aria-labelledby="hero-heading"
      className="from-primary-900 to-primary-700 bg-linear-to-br text-white"
    >
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
    </Section>
  );
}
