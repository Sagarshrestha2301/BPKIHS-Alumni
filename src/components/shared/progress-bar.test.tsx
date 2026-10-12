import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getPercent, ProgressBar } from './progress-bar';

describe('getPercent', () => {
  it('rounds, caps at 100 and handles a zero target', () => {
    expect(getPercent(2500, 10000)).toBe(25);
    expect(getPercent(15000, 10000)).toBe(100);
    expect(getPercent(100, 0)).toBe(0);
  });
});

describe('ProgressBar', () => {
  it('exposes the percentage to assistive technology', () => {
    render(
      <ProgressBar
        label="Scholarship Fund"
        raised={2500}
        target={10000}
        raisedLabel="NPR 25"
        targetLabel="NPR 100"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Scholarship Fund' });
    expect(bar).toHaveAttribute('aria-valuenow', '25');
  });
});
