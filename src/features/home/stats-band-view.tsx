import { Banknote, Globe, GraduationCap, type LucideIcon, Users } from 'lucide-react';

import { Section } from '@/components/layout/section';
import { StatCard } from '@/components/shared/stat-card';
import type { SiteStats } from '@/lib/api/types';
import { formatNprCompact } from '@/lib/format/money';

type StatsBandViewProps = {
  stats: SiteStats;
};

type Item = { key: string; icon: LucideIcon; value: string; label: string };

const count = new Intl.NumberFormat('en-IN');

function buildItems(stats: SiteStats): Item[] {
  const items: Item[] = [
    { key: 'alumni', icon: Users, value: count.format(stats.alumniCount), label: 'Alumni' },
    {
      key: 'raised',
      icon: Banknote,
      value: formatNprCompact(stats.raisedMinor),
      label: 'Funds raised',
    },
    {
      key: 'programmes',
      icon: GraduationCap,
      value: count.format(stats.activeProgrammes),
      label: 'Active programmes',
    },
  ];
  if (stats.countries !== undefined) {
    items.push({
      key: 'countries',
      icon: Globe,
      value: count.format(stats.countries),
      label: 'Countries',
    });
  }
  return items;
}

export function StatsBandView({ stats }: StatsBandViewProps) {
  const items = buildItems(stats);
  const columns = items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';

  return (
    <Section tone="tint" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Our community in numbers
      </h2>
      <div className={`grid grid-cols-2 gap-4 ${columns}`}>
        {items.map((item) => (
          <StatCard key={item.key} icon={item.icon} value={item.value} label={item.label} />
        ))}
      </div>
    </Section>
  );
}
