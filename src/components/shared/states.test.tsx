import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

describe('EmptyState', () => {
  it('shows the title and description', () => {
    render(<EmptyState title="No alumni match" description="Try fewer filters." />);
    expect(screen.getByText('No alumni match')).toBeInTheDocument();
    expect(screen.getByText('Try fewer filters.')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('announces the error and calls onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
