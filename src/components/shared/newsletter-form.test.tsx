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

  it('asks the visitor to confirm by email after the API call', async () => {
    const client = createFakeClient({
      subscribeNewsletter: async () => ({ ok: true, confirmationEmailSent: true }),
    });
    render(<NewsletterForm client={client} />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'name@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your inbox for the confirmation',
    );
  });

  it('says so when the confirmation email could not be sent', async () => {
    const client = createFakeClient({
      subscribeNewsletter: async () => ({ ok: true, confirmationEmailSent: false }),
    });
    render(<NewsletterForm client={client} />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'name@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not send the confirmation email',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveValue('name@example.com');
  });
});
