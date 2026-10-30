import { describe, expect, it } from 'vitest';

import {
  changePasswordSchema,
  expertiseSchema,
  forgotPasswordSchema,
  profileUpdateSchema,
  resetPasswordSchema,
} from './schemas';

const profile = {
  fullName: 'Asha Rai',
  country: 'Nepal',
  expertise: [] as string[],
  privacy: { email: 'hidden', phone: 'hidden', profile: 'public' },
} as const;

describe('expertiseSchema', () => {
  it('trims, collapses spaces and removes duplicates regardless of case', () => {
    expect(expertiseSchema.parse(['  Public   health ', 'public health', '', 'Research'])).toEqual([
      'Public health',
      'Research',
    ]);
  });

  it('rejects more than eight areas', () => {
    const tooMany = Array.from({ length: 9 }, (_, index) => `Area ${index}`);
    expect(expertiseSchema.safeParse(tooMany).success).toBe(false);
  });

  it('rejects an entry over forty characters', () => {
    expect(expertiseSchema.safeParse(['x'.repeat(41)]).success).toBe(false);
  });
});

describe('profileUpdateSchema', () => {
  it('accepts the minimum a member must provide', () => {
    expect(profileUpdateSchema.safeParse(profile).success).toBe(true);
  });

  it('rejects a malformed phone number', () => {
    expect(profileUpdateSchema.safeParse({ ...profile, phone: 'not-a-number' }).success).toBe(
      false,
    );
  });

  it('rejects a blank country', () => {
    expect(profileUpdateSchema.safeParse({ ...profile, country: '  ' }).success).toBe(false);
  });

  it('cannot carry a status or an email', () => {
    const parsed = profileUpdateSchema.parse({
      ...profile,
      status: 'approved',
      email: 'someone@example.com',
    });
    expect(parsed).not.toHaveProperty('status');
    expect(parsed).not.toHaveProperty('email');
  });
});

describe('password schemas', () => {
  it('requires the confirmation to match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old-password',
      newPassword: 'SomeLongPassword!2026',
      confirmPassword: 'OtherLongPassword!2026',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('enforces the twelve character minimum', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old-password',
        newPassword: 'short',
        confirmPassword: 'short',
      }).success,
    ).toBe(false);
  });

  it('accepts a matching new password', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old-password',
        newPassword: 'SomeLongPassword!2026',
        confirmPassword: 'SomeLongPassword!2026',
      }).success,
    ).toBe(true);
  });

  it('requires a token when resetting', () => {
    expect(
      resetPasswordSchema.safeParse({
        token: ' ',
        password: 'SomeLongPassword!2026',
        confirmPassword: 'SomeLongPassword!2026',
      }).success,
    ).toBe(false);
  });

  it('accepts an email for the reset request', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'asha@example.com' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});
