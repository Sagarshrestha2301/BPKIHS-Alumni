import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders its label as a button', () => {
    render(<Button>Give now</Button>);
    expect(screen.getByRole('button', { name: 'Give now' })).toBeInTheDocument();
  });
});
