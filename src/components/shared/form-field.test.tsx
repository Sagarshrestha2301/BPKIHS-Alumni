import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';

describe('FormField', () => {
  it('links the label, hint and error to the control', () => {
    render(
      <FormField label="Full name" hint="As on your certificate" error="Name is required" required>
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText(/Full name/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription(/As on your certificate/);
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
  });

  it('shows no error state when there is no error', () => {
    render(<FormField label="City">{(control) => <Input {...control} />}</FormField>);
    expect(screen.getByLabelText('City')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
