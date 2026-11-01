import { Banknote, Globe, GraduationCap, type LucideIcon, Users } from 'lucide-react';

import { Section } from '@/components/layout/section';
import { CountUp } from '@/components/shared/count-up';
import { StatCard } from '@/components/shared/stat-card';
import type { SiteStats } from '@/lib/api/types';

type StatsBandViewProps = {
  stats: SiteStats;
};

type Item = {
  key: string;
  icon: LucideIcon;
  /** The value to count up to; formatting is decided by kind. */
  end: number;
  label: string;
  /** `nprCompact` abbreviates the paisa amount like the server does; `plain` groups digits. */
  kind: 'plain' | 'nprCompact';
};

/**
 * Builds the band's items from the real API fields. `en-IN` digit grouping stays inside
 * `CountUp`'s formatters, which use the same rules as the server's formatters.
 */
function buildItems(stats: SiteStats): Item[] {
  const items: Item[] = [
    { key: 'alumni', icon: Users, end: stats.alumniCount, label: 'Alumni', kind: 'plain' },
    {
      key: 'raised',
      icon: Banknote,
      end: stats.raisedMinor,
      label: 'Funds raised',
      kind: 'nprCompact',
    },
    {
      key: 'programmes',
      icon: GraduationCap,
      end: stats.activeProgrammes,
      label: 'Active programmes',
      kind: 'plain',
    },
  ];
  if (stats.countries !== undefined) {
    items.push({
      key: 'countries',
      icon: Globe,
      end: stats.countries,
      label: 'Countries',
      kind: 'plain',
    });
  }
  return items;
}

/**
 * The band is the page's one orchestrated movement: each figure settles from zero when the
 * band reaches the middle of the viewport, once, and never moves again. `CountUp` keeps the
 * server-rendered final value for no-JS visitors, so the numbers stay data.
 */
export function StatsBandView({ stats }: StatsBandViewProps) {
  const items = buildItems(stats);
  const columns = items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';

  return (
    <Section tone="tint" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Our community in numbers
      </h2>
      <div className={`grid grid-cols-2 gap-4 ${columns}`}>
        {items.map((item, index) => (
          <StatCard
            key={item.key}
            icon={item.icon}
            value={<CountUp end={item.end} kind={item.kind} delay={index * 110} />}
            label={item.label}
          />
        ))}
      </div>
    </Section>
  );
}
