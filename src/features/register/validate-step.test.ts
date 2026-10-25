import { describe, expect, it } from 'vitest';

import {
  createInitialRegisterValues,
  type RegisterFormValues,
} from '@/features/register/register-form-values';
import { validateAll } from '@/features/register/validate-all';
import { validateStep } from '@/features/register/validate-step';

const LONG_PASSWORD = 'correct horse battery';

function validValues(): RegisterFormValues {
  return {
    ...createInitialRegisterValues(),
    fullName: 'Asha Rai',
    programme: 'MBBS',
    batchYear: '2012',
    country: 'Nepal',
    city: 'Kathmandu',
    email: 'asha@example.com',
    password: LONG_PASSWORD,
    confirmPassword: LONG_PASSWORD,
    consent: true,
  };
}

describe('validateStep: About you (step 0)', () => {
  it('asks for name, programme, batch year and country when everything is empty', () => {
    const result = validateStep(0, createInitialRegisterValues());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      fullName: 'Enter your full name.',
      programme: 'Choose your programme.',
      batchYear: 'Enter your batch year, for example 2012.',
      country: 'Choose your country.',
    });
    expect(result.firstInvalidField).toBe('fullName');
  });

  it('does not ask for the city', () => {
    const result = validateStep(0, { ...validValues(), city: '' });
    expect(result.ok).toBe(true);
  });

  it('rejects text, decimals and years that are too early or too late', () => {
    const early = validateStep(0, { ...validValues(), batchYear: '1980' });
    expect(early.ok).toBe(false);
    if (!early.ok) expect(early.errors.batchYear).toMatch(/onwards/);

    const late = validateStep(0, {
      ...validValues(),
      batchYear: String(new Date().getFullYear() + 2),
    });
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.errors.batchYear).toMatch(/future/);

    for (const text of ['abc', '12.5']) {
      const result = validateStep(0, { ...validValues(), batchYear: text });
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.errors.batchYear).toBe('Enter your batch year, for example 2012.');
    }
  });

  it('asks for the country in the text box when "Other" is chosen', () => {
    const result = validateStep(0, { ...validValues(), country: 'Other', countryOther: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.countryOther).toBe('Enter your country.');
    expect(result.errors.country).toBeUndefined();
  });

  it('accepts a typed country with "Other"', () => {
    expect(validateStep(0, { ...validValues(), country: 'Other', countryOther: 'Bhutan' }).ok).toBe(
      true,
    );
  });
});

describe('validateStep: Career (step 1)', () => {
  it('passes when it is all empty, because every field is optional', () => {
    expect(validateStep(1, createInitialRegisterValues()).ok).toBe(true);
  });

  it('rejects a note that is too long', () => {
    const result = validateStep(1, { ...validValues(), note: 'x'.repeat(501) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.note).toBeTruthy();
  });
});

describe('validateStep: Account and privacy (step 2)', () => {
  it('needs an email, a password and the consent box', () => {
    const result = validateStep(2, createInitialRegisterValues());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      email: 'Enter your email address.',
      password: 'Use at least 12 characters.',
      confirmPassword: 'Repeat your password.',
      consent: 'Please agree to the terms to register.',
    });
    expect(result.firstInvalidField).toBe('email');
  });

  it('rejects a short password and a confirmation that does not match', () => {
    const short = validateStep(2, {
      ...validValues(),
      password: 'short',
      confirmPassword: 'short',
    });
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.errors.password).toBe('Use at least 12 characters.');

    const mismatch = validateStep(2, { ...validValues(), confirmPassword: 'something else' });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok)
      expect(mismatch.errors.confirmPassword).toBe('The two passwords do not match.');
  });

  it('rejects a malformed email and phone number', () => {
    const result = validateStep(2, { ...validValues(), email: 'abc', phone: '12' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toMatch(/valid email/);
    expect(result.errors.phone).toMatch(/valid phone number/);
  });

  it('accepts an empty phone number', () => {
    expect(validateStep(2, { ...validValues(), phone: '' }).ok).toBe(true);
  });
});

describe('validateStep: general', () => {
  it('ignores problems in other steps', () => {
    const empty = createInitialRegisterValues();
    expect(validateStep(1, empty).ok).toBe(true);
  });

  it('passes every step for valid values', () => {
    for (const index of [0, 1, 2]) expect(validateStep(index, validValues()).ok).toBe(true);
  });

  it('throws for a step that does not exist', () => {
    expect(() => validateStep(3, validValues())).toThrow(RangeError);
    expect(() => validateStep(-1, validValues())).toThrow(RangeError);
  });
});

describe('validateAll', () => {
  it('returns the parsed, typed data when everything is valid', () => {
    const result = validateAll({
      ...validValues(),
      fullName: '  Asha Rai  ',
      privacyEmail: 'public',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.fullName).toBe('Asha Rai');
    expect(result.data.batchYear).toBe(2012);
    expect(result.data.country).toBe('Nepal');
    expect(result.data.privacy).toEqual({
      email: 'public',
      phone: 'hidden',
      profile: 'alumni_only',
    });
    expect(result.data.consent).toBe(true);
  });

  it('points at the first step with a problem', () => {
    const result = validateAll(createInitialRegisterValues());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.firstInvalidStep).toBe(0);
    expect(result.firstInvalidField).toBe('fullName');
  });

  it('catches a problem left behind in a later step', () => {
    const result = validateAll({ ...validValues(), consent: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.firstInvalidStep).toBe(2);
    expect(result.firstInvalidField).toBe('consent');
    expect(result.errors.consent).toBe('Please agree to the terms to register.');
  });
});
