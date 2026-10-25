import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeClient } from '@/test/fake-client';

import { NewsletterForm } from './newsletter-form';

describe('NewsletterForm', () => {
  it('shows an inline error for an invalid email', () => {
    render(<NewsletterForm />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('confirms a valid email after the API call', async () => {
    const client = createFakeClient({
      subscribeNewsletter: async () => ({ ok: true }),
    });
    render(<NewsletterForm client={client} />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'name@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByRole('status')).toHaveTextContent('You are on the list');
  });
});
