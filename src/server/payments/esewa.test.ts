import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import { esewaGateway } from './esewa';

const SECRET = 'test-secret';
const PRODUCT = 'EPAYTEST';
const DONATION_ID = 'donation-1';

function sign(message: string): string {
  return createHmac('sha256', SECRET).update(message).digest('base64');
}

function callbackPayload(overrides: Record<string, unknown> = {}): URLSearchParams {
  const body = {
    transaction_code: 'ABC123',
    status: 'COMPLETE',
    total_amount: '2500.00',
    transaction_uuid: DONATION_ID,
    product_code: PRODUCT,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    ...overrides,
  };
  // Signs the original values, then applies the overrides, so a test can hand the
  // gateway a payload that no longer matches its signature.
  const signature = sign(
    `total_amount=2500.00,transaction_uuid=${DONATION_ID},product_code=${PRODUCT}`,
  );
  const data = Buffer.from(JSON.stringify({ ...body, signature })).toString('base64');
  return new URLSearchParams({ data });
}

/** Signs the overridden values too, for cases where the signature itself is valid. */
function signedCallbackPayload(overrides: Record<string, unknown> = {}): URLSearchParams {
  const body = {
    transaction_code: 'ABC123',
    status: 'COMPLETE',
    total_amount: '2500.00',
    transaction_uuid: DONATION_ID,
    product_code: PRODUCT,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    ...overrides,
  };
  const message = String(body.signed_field_names)
    .split(',')
    .map((name) => `${name}=${String(body[name as keyof typeof body] ?? '')}`)
    .join(',');
  const data = Buffer.from(JSON.stringify({ ...body, signature: sign(message) })).toString(
    'base64',
  );
  return new URLSearchParams({ data });
}

describe('eSewa gateway', () => {
  beforeEach(() => {
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.ESEWA_PRODUCT_CODE = PRODUCT;
    process.env.ESEWA_SECRET_KEY = SECRET;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.ESEWA_GATEWAY_URL;
  });

  afterEach(() => {
    delete process.env.PAYMENT_MODE;
    delete process.env.ESEWA_PRODUCT_CODE;
    delete process.env.ESEWA_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('reports itself unconfigured without keys', () => {
    delete process.env.ESEWA_SECRET_KEY;
    expect(esewaGateway.isConfigured()).toBe(false);
  });

  it('signs the redirect form for the sandbox', async () => {
    const redirect = await esewaGateway.start({
      donationId: DONATION_ID,
      amountMinor: 250_000,
      description: 'Gift',
      donorName: 'Donor',
      donorEmail: 'donor@example.com',
    });

    expect(redirect.method).toBe('POST');
    expect(redirect.url).toContain('rc-epay.esewa.com.np');
    expect(redirect.fields).toMatchObject({
      total_amount: '2500.00',
      transaction_uuid: DONATION_ID,
      product_code: PRODUCT,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      success_url: 'http://localhost:3000/api/v1/payments/esewa/callback',
    });
    expect(redirect.fields?.signature).toBe(
      sign(`total_amount=2500.00,transaction_uuid=${DONATION_ID},product_code=${PRODUCT}`),
    );
  });

  it('accepts a signed callback and reads the amount', async () => {
    const verification = await esewaGateway.verify(callbackPayload());

    expect(verification).toMatchObject({
      donationId: DONATION_ID,
      reference: 'ABC123',
      status: 'succeeded',
      amountMinor: 250_000,
    });
  });

  it('rejects a valid callback for another product code', async () => {
    await expect(
      esewaGateway.verify(signedCallbackPayload({ product_code: 'ANOTHER-MERCHANT' })),
    ).rejects.toThrow(/another product/i);
  });

  it('treats a non-COMPLETE status as failed', async () => {
    const verification = await esewaGateway.verify(callbackPayload({ status: 'CANCELED' }));
    expect(verification.status).toBe('failed');
  });

  it('rejects a payload whose amount was changed after signing', async () => {
    await expect(
      esewaGateway.verify(callbackPayload({ total_amount: '1.00' })),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects a callback without a payload', async () => {
    await expect(esewaGateway.verify(new URLSearchParams())).rejects.toBeInstanceOf(ApiError);
  });
});
