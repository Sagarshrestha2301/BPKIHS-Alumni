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
              className="flex flex-col rounded-xl border border-neutral-300 bg-white p-6 shadow-sm"
            >
              <Icon aria-hidden="true" className="text-primary-700 size-6" />
              <h3 className="font-heading text-primary-900 mt-3 text-xl font-semibold">
                {door.title}
              </h3>
              <p className="mt-2 text-neutral-600">{door.text}</p>
              <ul className="mt-auto space-y-1 pt-6">
                {door.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-primary-700 hover:text-primary-900 focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-1.5 rounded-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3"
                    >
                      {link.label}
                      <ArrowRight aria-hidden="true" className="size-4" />
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
