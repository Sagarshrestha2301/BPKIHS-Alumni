import { generateKeyPairSync, verify as rsaVerify } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import {
  buildConnectipsForm,
  connectipsGateway,
  validateConnectipsTransaction,
} from './connectips';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** The exact string connectIPS documents for the login-page form. */
function initiationMessage(fields: Record<string, string>): string {
  return [
    `MERCHANTID=${fields.MERCHANTID}`,
    `APPID=${fields.APPID}`,
    `APPNAME=${fields.APPNAME}`,
    `TXNID=${fields.TXNID}`,
    `TXNDATE=${fields.TXNDATE}`,
    `TXNCRNCY=${fields.TXNCRNCY}`,
    `TXNAMT=${fields.TXNAMT}`,
    `REFERENCEID=${fields.REFERENCEID}`,
    `REMARKS=${fields.REMARKS}`,
    `PARTICULARS=${fields.PARTICULARS}`,
    'TOKEN=TOKEN',
  ].join(',');
}

function validationMessage(reference: string, amount: string): string {
  return `MERCHANTID=550,APPID=MER-550-APP-1,REFERENCEID=${reference},TXNAMT=${amount}`;
}

function signedWithPublicKey(message: string, signature: string): boolean {
  return rsaVerify('RSA-SHA256', Buffer.from(message), publicKey, Buffer.from(signature, 'base64'));
}

/** Index access is `string | undefined` under `noUncheckedIndexedAccess`; a form field is present here. */
function fieldOf(fields: Record<string, string>, name: string): string {
  return fields[name] ?? '';
}

function validationResponse(overrides: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({
      merchantId: 550,
      appId: 'MER-550-APP-1',
      referenceId: 'TXN123',
      txnAmt: '250000',
      token: null,
      status: 'SUCCESS',
      statusDesc: 'TRANSACTION SUCCESSFUL',
      ...overrides,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('ConnectIPS gateway', () => {
  beforeEach(() => {
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.CONNECTIPS_BASE_URL = 'https://uat.connectips.example';
    process.env.CONNECTIPS_MERCHANT_ID = '550';
    process.env.CONNECTIPS_APP_ID = 'MER-550-APP-1';
    process.env.CONNECTIPS_APP_NAME = 'BPKIHS Alumni';
    process.env.CONNECTIPS_APP_PASSWORD = 'app-password';
    process.env.CONNECTIPS_PRIVATE_KEY = privateKey;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const name of [
      'PAYMENT_MODE',
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

  it('reports itself unconfigured without a signing key', () => {
    delete process.env.CONNECTIPS_PRIVATE_KEY;
    expect(connectipsGateway.isConfigured()).toBe(false);

    process.env.CONNECTIPS_PRIVATE_KEY_PATH = './secrets/connectips.key';
    expect(connectipsGateway.isConfigured()).toBe(true);
  });

  it('signs the login-page form with the documented field string', () => {
    const redirect = buildConnectipsForm({
      reference: 'ABCDEF0123456789ABCD',
      amountMinor: 250_000,
      description: 'BPKIHS Alumni Association gift',
      // 18:30 UTC is already the next day in Kathmandu (UTC+5:45).
      now: new Date('2026-10-29T18:30:00Z'),
    });

    expect(redirect).toMatchObject({
      url: 'https://uat.connectips.example/connectipswebgw/loginpage',
      method: 'POST',
    });
    const fields = redirect.fields as Record<string, string>;
    expect(fields).toMatchObject({
      MERCHANTID: '550',
      APPID: 'MER-550-APP-1',
      APPNAME: 'BPKIHS Alumni',
      TXNID: 'ABCDEF0123456789ABCD',
      TXNDATE: '30-10-2026',
      TXNCRNCY: 'NPR',
      TXNAMT: '250000',
      REFERENCEID: 'ABCDEF0123456789ABCD',
      REMARKS: 'BPKIHS Alumni Association gift',
      PARTICULARS: 'BPKIHS Alumni Association gift',
    });
    expect(signedWithPublicKey(initiationMessage(fields), fieldOf(fields, 'TOKEN'))).toBe(true);
  });

  it('truncates the free-text fields to the documented lengths', () => {
    const redirect = buildConnectipsForm({
      reference: 'TXN1',
      amountMinor: 10_000,
      description: 'x'.repeat(120),
    });
    const fields = redirect.fields as Record<string, string>;

    expect(fieldOf(fields, 'REMARKS').length).toBeLessThanOrEqual(50);
    expect(fieldOf(fields, 'PARTICULARS').length).toBeLessThanOrEqual(100);
    expect(signedWithPublicKey(initiationMessage(fields), fieldOf(fields, 'TOKEN'))).toBe(true);
  });

  it('refuses a reference longer than the gateway allows', () => {
    expect(() =>
      buildConnectipsForm({ reference: 'x'.repeat(21), amountMinor: 10_000, description: 'Gift' }),
    ).toThrow(/1–20/);
    expect(() =>
      buildConnectipsForm({ reference: 'TXN 1', amountMinor: 10_000, description: 'Gift' }),
    ).toThrow(ApiError);
  });

  it('requires a short reference before starting', async () => {
    await expect(
      connectipsGateway.start({
        donationId: 'f0e5a5f6-6a3e-4e5f-9f3c-1c2d3e4f5a6b',
        amountMinor: 10_000,
        description: 'Gift',
        donorName: 'Donor',
        donorEmail: 'donor@example.com',
      }),
    ).rejects.toThrow(/short transaction reference/);
  });

  it('validates a paid transaction and reads the confirmed amount', async () => {
    const fetchMock = vi.fn().mockResolvedValue(validationResponse());
    vi.stubGlobal('fetch', fetchMock);

    const result = await validateConnectipsTransaction('TXN123', 250_000);

    expect(result).toMatchObject({
      reference: 'TXN123',
      status: 'succeeded',
      amountMinor: 250_000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://uat.connectips.example/connectipswebws/api/creditor/validatetxn');
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('Authorization')).toBe(
      `Basic ${Buffer.from('MER-550-APP-1:app-password').toString('base64')}`,
    );

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      merchantId: 550,
      appId: 'MER-550-APP-1',
      referenceId: 'TXN123',
      txnAmt: 250_000,
    });
    expect(signedWithPublicKey(validationMessage('TXN123', '250000'), String(body.token))).toBe(
      true,
    );
  });

  it('treats any status other than SUCCESS as failed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        validationResponse({
          status: 'FAILED',
          statusDesc: 'TRANSACTION FAILED',
          txnAmt: '250000',
        }),
      ),
    );

    const result = await validateConnectipsTransaction('TXN123', 250_000);
    expect(result.status).toBe('failed');
  });

  it('rejects an answer that names another application or merchant', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(validationResponse({ appId: 'SOMEONE-ELSE' })),
    );
    await expect(validateConnectipsTransaction('TXN123', 250_000)).rejects.toThrow(
      /another application/,
    );

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(validationResponse({ merchantId: 999 })));
    await expect(validateConnectipsTransaction('TXN123', 250_000)).rejects.toThrow(
      /another merchant/,
    );
  });

  it('reports a rejected validation request without claiming success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 401 })));
    await expect(validateConnectipsTransaction('TXN123', 250_000)).rejects.toThrow(
      /rejected the validation request/,
    );
  });

  it('fails closed when the validation endpoint is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(validateConnectipsTransaction('TXN123', 250_000)).rejects.toThrow(
      /did not answer/,
    );
  });

  it('refuses a malformed transaction id before calling the gateway', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateConnectipsTransaction('bad id', 250_000)).rejects.toThrow(ApiError);
    await expect(validateConnectipsTransaction('', 250_000)).rejects.toThrow(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
