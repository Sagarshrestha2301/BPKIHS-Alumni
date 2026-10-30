import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { gatewayOverview } from './status';

const ENV_NAMES = [
  'PAYMENT_MODE',
  'ESEWA_PRODUCT_CODE',
  'ESEWA_SECRET_KEY',
  'ESEWA_GATEWAY_URL',
  'KHALTI_SECRET_KEY',
  'KHALTI_BASE_URL',
  'CONNECTIPS_BASE_URL',
  'CONNECTIPS_MERCHANT_ID',
  'CONNECTIPS_APP_ID',
  'CONNECTIPS_APP_NAME',
  'CONNECTIPS_APP_PASSWORD',
  'CONNECTIPS_PRIVATE_KEY',
  'CONNECTIPS_PRIVATE_KEY_PATH',
];

function clear(): void {
  for (const name of ENV_NAMES) delete process.env[name];
}

function gateway(id: string) {
  const found = gatewayOverview().gateways.find((entry) => entry.id === id);
  if (!found) throw new Error(`${id} is missing from the overview`);
  return found;
}

describe('gatewayOverview', () => {
  beforeEach(clear);
  afterEach(clear);

  it('reports an unset payment mode instead of throwing', () => {
    const overview = gatewayOverview();
    expect(overview.mode).toBeNull();
    expect(overview.gateways.every((entry) => !entry.offered)).toBe(true);
  });

  it('names the missing settings, never their values', () => {
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';

    const esewa = gateway('esewa');
    expect(esewa.configured).toBe(false);
    expect(esewa.offered).toBe(false);
    expect(esewa.missing).toEqual(['ESEWA_SECRET_KEY']);

    // The overview is rendered on an admin page, so it must not carry credentials with it.
    expect(JSON.stringify(gatewayOverview())).not.toContain('EPAYTEST');
  });

  it('offers a fully configured gateway once payments have a mode', () => {
    process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
    process.env.ESEWA_SECRET_KEY = 'esewa-secret';

    // Credentials without a mode: the checkout cannot start, so nothing is offered.
    expect(gateway('esewa').configured).toBe(true);
    expect(gateway('esewa').offered).toBe(false);

    process.env.PAYMENT_MODE = 'sandbox';
    expect(gateway('esewa').offered).toBe(true);
  });

  it('lists ConnectIPS with the signing key it still needs', () => {
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.CONNECTIPS_BASE_URL = 'https://uat.connectips.example';
    process.env.CONNECTIPS_MERCHANT_ID = '550';
    process.env.CONNECTIPS_APP_ID = 'MER-550-APP-1';
    process.env.CONNECTIPS_APP_NAME = 'BPKIHS Alumni';
    process.env.CONNECTIPS_APP_PASSWORD = 'app-password';

    expect(gateway('connectips').missing).toEqual([
      'CONNECTIPS_PRIVATE_KEY or CONNECTIPS_PRIVATE_KEY_PATH',
    ]);
    expect(gateway('connectips').offered).toBe(false);

    process.env.CONNECTIPS_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';
    expect(gateway('connectips').missing).toEqual([]);
    expect(gateway('connectips').offered).toBe(true);
  });

  it('lists Fonepay as agreed but without an adapter', () => {
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
    process.env.ESEWA_SECRET_KEY = 'esewa-secret';

    const fonepay = gateway('fonepay');
    expect(fonepay.hasAdapter).toBe(false);
    expect(fonepay.configured).toBe(false);
    expect(fonepay.offered).toBe(false);
  });
});
