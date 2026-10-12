import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DonateButton } from '@/components/shared/donate-button';

describe('DonateButton', () => {
  it('uses the donate colour instead of the primary colour', () => {
    render(<DonateButton>Give now</DonateButton>);
    const button = screen.getByRole('button', { name: 'Give now' });
    expect(button).toHaveClass('bg-accent-600');
    expect(button).not.toHaveClass('bg-primary');
  });
});
