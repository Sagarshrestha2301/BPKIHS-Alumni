import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatsBandView } from '@/features/home/stats-band-view';
import { formatNprCompact } from '@/lib/format/money';

const stats = { alumniCount: 128, raisedMinor: 250_000_000, activeProgrammes: 6, countries: 9 };

describe('StatsBandView', () => {
  it('shows every number with its label', () => {
    render(<StatsBandView stats={stats} />);
    expect(screen.getByText('128')).toBeTruthy();
    expect(screen.getByText(formatNprCompact(stats.raisedMinor))).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
    expect(screen.getByText('Funds raised')).toBeTruthy();
    expect(screen.getByText('Countries')).toBeTruthy();
  });

  it('leaves out countries when the API does not send it', () => {
    render(<StatsBandView stats={{ ...stats, countries: undefined }} />);
    expect(screen.queryByText('Countries')).toBeNull();
    expect(screen.getByText('Alumni')).toBeTruthy();
  });

  it('has a heading for screen readers', () => {
    render(<StatsBandView stats={stats} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Our community in numbers' }),
    ).toBeTruthy();
  });
});
