import { ArrowRight, CalendarDays, Heart, type LucideIcon, Users } from 'lucide-react';
import Link from 'next/link';

import { Section } from '@/components/layout/section';
import { SectionHeading } from '@/components/shared/section-heading';
import { doors } from '@/content/home';

type DoorKey = (typeof doors.items)[number]['key'];

const icons: Record<DoorKey, LucideIcon> = { give: Heart, network: Users, events: CalendarDays };

export function ThreeDoors() {
  return (
    <Section aria-label={doors.title}>
      <SectionHeading eyebrow={doors.eyebrow} title={doors.title} description={doors.description} />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {doors.items.map((door) => {
          const Icon = icons[door.key];
          return (
            <article
              key={door.key}
              className="group card-lift hover:border-primary-700/40 relative flex flex-col justify-between rounded-xl border border-neutral-300/80 bg-white p-7 shadow-xs transition-all duration-180"
            >
              <div>
                <div className="bg-primary-100/80 text-primary-700 group-hover:bg-primary-100 mb-5 flex size-12 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105">
                  <Icon aria-hidden="true" className="size-6" />
                </div>
                <h3 className="font-heading text-primary-900 text-xl font-semibold tracking-tight">
                  {door.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">{door.text}</p>
              </div>
              <ul className="mt-6 space-y-1.5 border-t border-neutral-100 pt-5">
                {door.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group/link text-primary-700 hover:text-primary-900 focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-2 rounded-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
                    >
                      <span>{link.label}</span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-180 motion-safe:group-hover/link:translate-x-1"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
