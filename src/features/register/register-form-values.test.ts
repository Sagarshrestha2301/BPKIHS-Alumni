import { describe, expect, it } from 'vitest';

import {
  createInitialRegisterValues,
  parseBatchYear,
  toRegistrationCandidate,
} from '@/features/register/register-form-values';

describe('createInitialRegisterValues', () => {
  it('exposes nothing by default and does not tick consent', () => {
    const values = createInitialRegisterValues();
    expect(values.privacyEmail).toBe('hidden');
    expect(values.privacyPhone).toBe('hidden');
    expect(values.privacyProfile).toBe('alumni_only');
    expect(values.consent).toBe(false);
  });

  it('returns a fresh object each time', () => {
    const first = createInitialRegisterValues();
    first.fullName = 'Changed';
    expect(createInitialRegisterValues().fullName).toBe('');
  });
});

describe('parseBatchYear', () => {
  it('reads whole years and ignores surrounding spaces', () => {
    expect(parseBatchYear('2012')).toBe(2012);
    expect(parseBatchYear(' 2012 ')).toBe(2012);
  });

  it('gives undefined for an empty box', () => {
    expect(parseBatchYear('')).toBeUndefined();
    expect(parseBatchYear('   ')).toBeUndefined();
  });

  it('gives NaN for anything that is not plain digits', () => {
    for (const text of ['abc', '12.5', '2012abc', '-2012', '1e3']) {
      expect(Number.isNaN(parseBatchYear(text))).toBe(true);
    }
  });
});

describe('toRegistrationCandidate', () => {
  it('nests the privacy settings and converts the batch year', () => {
    const candidate = toRegistrationCandidate({
      ...createInitialRegisterValues(),
      fullName: 'Asha Rai',
      programme: 'MBBS',
      batchYear: '2012',
      country: 'Nepal',
      email: 'asha@example.com',
      privacyEmail: 'public',
      consent: true,
    });
    expect(candidate).toMatchObject({
      fullName: 'Asha Rai',
      programme: 'MBBS',
      batchYear: 2012,
      country: 'Nepal',
      email: 'asha@example.com',
      privacy: { email: 'public', phone: 'hidden', profile: 'alumni_only' },
      consent: true,
    });
  });

  it('uses the typed country when "Other" is chosen', () => {
    const candidate = toRegistrationCandidate({
      ...createInitialRegisterValues(),
      country: 'Other',
      countryOther: 'Bhutan',
    });
    expect(candidate.country).toBe('Bhutan');
  });

  it('ignores the typed country when a listed one is chosen', () => {
    const candidate = toRegistrationCandidate({
      ...createInitialRegisterValues(),
      country: 'India',
      countryOther: 'Leftover text',
    });
    expect(candidate.country).toBe('India');
  });
});
