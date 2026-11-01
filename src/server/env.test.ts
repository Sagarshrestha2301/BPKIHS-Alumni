import { describe, expect, it, vi } from 'vitest';

import { productionEnvProblems } from './env';

function validEnv(
  _overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  const base: Record<string, string | undefined> = {
    DATABASE_URL: 'postgres://user:pass@db.example.net:5432/alumni',
    BETTER_AUTH_SECRET: 'J8f2mQ4zR7tY1pL6vN3xB9cK5wH0sD8a',
    APP_URL: 'https://alumni.org',
    NEXT_PUBLIC_SITE_URL: 'https://alumni.org',
    PAYMENT_MODE: 'live',
    ESEWA_PRODUCT_CODE: 'ESEWA-MERCHANT',
    ESEWA_SECRET_KEY: 'gateway-secret',
    ESEWA_GATEWAY_URL: 'https://epay.esewa.com.np/api/epay/main/v2/form',
    EMAIL_TRANSPORT: 'resend',
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'BPKIHS Alumni <no-reply@alumni.org>',
    CONTACT_EMAIL: 'office@alumni.org',
    TURNSTILE_SECRET_KEY: 'turnstile-secret',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-key',
    NODE_ENV: 'production',
  };
  return { ...base, ..._overrides };
}

describe('productionEnvProblems', () => {
  it('accepts a complete production configuration', () => {
    expect(productionEnvProblems(validEnv())).toEqual([]);
  });

  it('rejects the payment simulator and a missing mode', () => {
    expect(productionEnvProblems(validEnv({ PAYMENT_MODE: 'simulator' }))).toContainEqual(
      expect.stringContaining('no simulator'),
    );
    expect(productionEnvProblems(validEnv({ PAYMENT_MODE: undefined }))).toContainEqual(
      expect.stringContaining('PAYMENT_MODE'),
    );
  });

  it('rejects the console email transport and a placeholder sender', () => {
    expect(productionEnvProblems(validEnv({ EMAIL_TRANSPORT: 'console' }))).toContainEqual(
      expect.stringContaining('EMAIL_TRANSPORT'),
    );
    expect(
      productionEnvProblems(validEnv({ EMAIL_FROM: 'Alumni <no-reply@bpkihs-alumni.local>' })),
    ).toContainEqual(expect.stringContaining('verified domain'));
  });

  it('rejects a missing contact email and a non-https origin', () => {
    expect(productionEnvProblems(validEnv({ CONTACT_EMAIL: undefined }))).toContainEqual(
      expect.stringContaining('CONTACT_EMAIL'),
    );
    expect(productionEnvProblems(validEnv({ APP_URL: 'http://alumni.org' }))).toContainEqual(
      expect.stringContaining('https'),
    );
  });

  it('rejects the example auth secret', () => {
    expect(
      productionEnvProblems(
        validEnv({ BETTER_AUTH_SECRET: 'replace-me-with-a-32-byte-random-string' }),
      ),
    ).toContainEqual(expect.stringContaining('example value'));
  });

  it('accepts production without bot protection keys (Turnstile is optional)', () => {
    expect(
      productionEnvProblems(
        validEnv({ TURNSTILE_SECRET_KEY: undefined, NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined }),
      ),
    ).toEqual([]);
  });

  it('requires a gateway and its live URL', () => {
    expect(
      productionEnvProblems(
        validEnv({ ESEWA_PRODUCT_CODE: undefined, ESEWA_SECRET_KEY: undefined }),
      ),
    ).toContainEqual(expect.stringContaining('at least one payment gateway'));

    expect(productionEnvProblems(validEnv({ ESEWA_GATEWAY_URL: undefined }))).toContainEqual(
      expect.stringContaining('ESEWA_GATEWAY_URL'),
    );
  });

  it('warns when production is left in sandbox mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    productionEnvProblems(validEnv({ PAYMENT_MODE: 'sandbox' }));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sandbox'));
    warn.mockRestore();
  });

  function connectipsEnv(
    overrides: Record<string, string | undefined> = {},
  ): Record<string, string | undefined> {
    return validEnv({
      ESEWA_PRODUCT_CODE: undefined,
      ESEWA_SECRET_KEY: undefined,
      ESEWA_GATEWAY_URL: undefined,
      CONNECTIPS_BASE_URL: 'https://uat.connectips.example',
      CONNECTIPS_MERCHANT_ID: '550',
      CONNECTIPS_APP_ID: 'MER-550-APP-1',
      CONNECTIPS_APP_NAME: 'BPKIHS Alumni',
      CONNECTIPS_APP_PASSWORD: 'app-password',
      CONNECTIPS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nplaceholder\n-----END PRIVATE KEY-----',
      ...overrides,
    });
  }

  it('accepts ConnectIPS as the only configured gateway', () => {
    expect(productionEnvProblems(connectipsEnv())).toEqual([]);
  });

  it('rejects a partly configured ConnectIPS', () => {
    expect(
      productionEnvProblems(connectipsEnv({ CONNECTIPS_APP_PASSWORD: undefined })),
    ).toContainEqual(expect.stringContaining('partly configured'));
    expect(
      productionEnvProblems(
        connectipsEnv({
          CONNECTIPS_PRIVATE_KEY: undefined,
          CONNECTIPS_PRIVATE_KEY_PATH: undefined,
        }),
      ),
    ).toContainEqual(expect.stringContaining('partly configured'));
  });

  it('rejects a non-https ConnectIPS base URL and a non-numeric merchant id', () => {
    expect(
      productionEnvProblems(connectipsEnv({ CONNECTIPS_BASE_URL: 'http://gateway.example' })),
    ).toContainEqual(expect.stringContaining('HTTPS'));
    expect(
      productionEnvProblems(connectipsEnv({ CONNECTIPS_MERCHANT_ID: 'MERCHANT' })),
    ).toContainEqual(expect.stringContaining('numeric'));
  });
});
