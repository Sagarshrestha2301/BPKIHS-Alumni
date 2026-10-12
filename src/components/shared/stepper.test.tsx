import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stepper } from './stepper';

const steps = [
  { id: 'amount', label: 'Amount' },
  { id: 'signin', label: 'Sign in' },
  { id: 'payment', label: 'Payment' },
];

describe('Stepper', () => {
  it('marks only the current step with aria-current', () => {
    render(<Stepper steps={steps} currentIndex={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });
});
