import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { createFakeClient } from '@/test/fake-client';

import { RegisterForm } from './register-form';

const LONG_PASSWORD = 'correct horse battery';

function renderForm() {
  const client = createFakeClient({
    submitRegistration: async () => ({
      id: 'alumnus-new-001',
      status: 'pending',
      email: 'asha@example.com',
    }),
  });
  return render(<RegisterForm client={client} />);
}

function fillAboutStep() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Asha Rai' } });
  fireEvent.change(screen.getByLabelText(/^programme/i), { target: { value: 'MBBS' } });
  fireEvent.change(screen.getByLabelText(/batch year/i), { target: { value: '2012' } });
  fireEvent.change(screen.getByLabelText(/^country/i), { target: { value: 'Nepal' } });
}

describe('RegisterForm', () => {
  it('shows field errors and stays on the first step when Next is pressed empty', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText('Enter your full name.')).toBeInTheDocument();
    expect(screen.getByText('Choose your programme.')).toBeInTheDocument();
    expect(screen.getByText('Choose your country.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
  });

  it('moves through the three steps and shows the pending-approval result', async () => {
    renderForm();

    fillAboutStep();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(screen.getByLabelText(/current position/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'asha@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: LONG_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/repeat password/i), {
      target: { value: LONG_PASSWORD },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/confirm your email address/i)).toBeInTheDocument();
    expect(screen.getByText(/asha@example\.com/i)).toBeInTheDocument();
  });

  it('asks for the emailed code and reports a rejected one', async () => {
    const client = createFakeClient({
      submitRegistration: async () => ({
        id: 'alumnus-new-001',
        status: 'pending',
        email: 'asha@example.com',
      }),
      verifyRegistration: async () => {
        throw new ApiError('validation', 'Invalid OTP');
      },
    });
    render(<RegisterForm client={client} />);

    fillAboutStep();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'asha@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: LONG_PASSWORD } });
    fireEvent.change(screen.getByLabelText(/repeat password/i), {
      target: { value: LONG_PASSWORD },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    const code = await screen.findByLabelText(/verification code/i);
    fireEvent.change(code, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm and sign in/i }));

    expect(await screen.findByText(/invalid otp/i)).toBeInTheDocument();
  });

  it('goes back to the first step when a later step is invalid', async () => {
    renderForm();

    fillAboutStep();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });
});
