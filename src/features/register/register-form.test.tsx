import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createMockAdapter } from '@/lib/api/mock';

import { RegisterForm } from './register-form';

function renderForm() {
  return render(<RegisterForm client={createMockAdapter()} />);
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
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit registration/i }));

    expect(await screen.findByText(/your profile is pending approval/i)).toBeInTheDocument();
    expect(screen.getByText(/alumnus-new-001/i)).toBeInTheDocument();
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
