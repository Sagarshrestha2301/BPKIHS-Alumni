import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CountUp } from '@/components/shared/count-up';

describe('CountUp', () => {
  it('renders initial formatted value for SSR and testing environments', () => {
    render(<CountUp end={88} kind="plain" />);
    expect(screen.getByText('88')).toBeTruthy();
  });

  it('renders compact NPR format correctly', () => {
    // 750000 paisa = 7500 rupees
    render(<CountUp end={750_000} kind="nprCompact" />);
    expect(screen.getByText('NPR 7,500')).toBeTruthy();
  });

  it('applies tabular-nums class to prevent horizontal character jitter', () => {
    const { container } = render(<CountUp end={13} kind="plain" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('tabular-nums');
  });

  it('handles zero values cleanly', () => {
    render(<CountUp end={0} kind="plain" />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});
