import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { availablePaymentMethods } from './index';

describe('availablePaymentMethods', () => {
  beforeEach(() => {
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
    process.env.ESEWA_SECRET_KEY = 'esewa-secret';
    process.env.KHALTI_SECRET_KEY = 'khalti-secret';
  });

  afterEach(() => {
    for (const name of [
      'PAYMENT_MODE',
      'ESEWA_PRODUCT_CODE',
      'ESEWA_SECRET_KEY',
      'KHALTI_SECRET_KEY',
      'CONNECTIPS_BASE_URL',
      'CONNECTIPS_MERCHANT_ID',
      'CONNECTIPS_APP_ID',
      'CONNECTIPS_APP_NAME',
      'CONNECTIPS_APP_PASSWORD',
      'CONNECTIPS_PRIVATE_KEY',
      'CONNECTIPS_PRIVATE_KEY_PATH',
    ]) {
      delete process.env[name];
    }
  });

  it('lists only gateways whose credentials are present', () => {
    expect(availablePaymentMethods()).toEqual(['esewa', 'khalti']);

    delete process.env.KHALTI_SECRET_KEY;
    expect(availablePaymentMethods()).toEqual(['esewa']);
  });

  it('adds ConnectIPS only when the full merchant configuration is present', () => {
    process.env.CONNECTIPS_BASE_URL = 'https://uat.connectips.example';
    process.env.CONNECTIPS_MERCHANT_ID = '550';
    process.env.CONNECTIPS_APP_ID = 'MER-550-APP-1';
    process.env.CONNECTIPS_APP_NAME = 'BPKIHS Alumni';
    process.env.CONNECTIPS_APP_PASSWORD = 'app-password';

    // Five of six values: still hidden, because a half-configured gateway cannot start.
    expect(availablePaymentMethods()).not.toContain('connectips');

    process.env.CONNECTIPS_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';
    expect(availablePaymentMethods()).toContain('connectips');
  });

  it('offers nothing when payments have no mode', () => {
    delete process.env.PAYMENT_MODE;
    expect(availablePaymentMethods()).toEqual([]);
  });
});
