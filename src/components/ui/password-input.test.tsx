import { fireEvent, render, screen } from '@testing-library/react';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('starts hidden and reveals the value only when asked', () => {
    render(<PasswordInput aria-label="Password" defaultValue="correct horse" />);
    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');
    expect(field).toHaveValue('correct horse');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('does not submit the form it sits in', () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Password" />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
