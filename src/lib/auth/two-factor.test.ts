import { describe, expect, it } from 'vitest';

import { adminTwoFactorRequired } from '@/lib/auth/two-factor';

describe('adminTwoFactorRequired', () => {
  it('requires TOTP for a production administrator who has not enrolled', () => {
    expect(adminTwoFactorRequired({ role: 'admin' }, 'production')).toBe(true);
    expect(adminTwoFactorRequired({ role: 'admin', twoFactorEnabled: false }, 'production')).toBe(
      true,
    );
    expect(adminTwoFactorRequired({ role: 'admin', twoFactorEnabled: null }, 'production')).toBe(
      true,
    );
  });

  it('accepts a production administrator who has enrolled', () => {
    expect(adminTwoFactorRequired({ role: 'admin', twoFactorEnabled: true }, 'production')).toBe(
      false,
    );
  });

  it('does not require TOTP for any other role', () => {
    expect(adminTwoFactorRequired({ role: 'alumni' }, 'production')).toBe(false);
    expect(adminTwoFactorRequired({ role: 'donor' }, 'production')).toBe(false);
    expect(adminTwoFactorRequired({}, 'production')).toBe(false);
  });

  it('does not enforce TOTP outside production', () => {
    expect(adminTwoFactorRequired({ role: 'admin' }, 'development')).toBe(false);
    expect(adminTwoFactorRequired({ role: 'admin' }, 'test')).toBe(false);
    expect(adminTwoFactorRequired({ role: 'admin' }, undefined)).toBe(false);
  });
});
