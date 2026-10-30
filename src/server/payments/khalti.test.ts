import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import { khaltiGateway } from './khalti';

const SECRET = 'live_secret_key_00000000000000000000000000000000';
const DONATION_ID = 'donation-1';
const PIDX = 'abc123def456ghi789';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function callsTo(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit][] {
  return fetchMock.mock.calls.map(([url, init]) => [String(url), init as RequestInit]);
}

describe('Khalti gateway', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    process.env.PAYMENT_MODE = 'sandbox';
    process.env.KHALTI_SECRET_KEY = SECRET;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.KHALTI_BASE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const name of [
      'PAYMENT_MODE',
      'KHALTI_SECRET_KEY',
      'KHALTI_BASE_URL',
      'NEXT_PUBLIC_APP_URL',
    ]) {
      delete process.env[name];
    }
  });

  it('reports itself unconfigured without a key', () => {
    delete process.env.KHALTI_SECRET_KEY;
    expect(khaltiGateway.isConfigured()).toBe(false);
    expect(khaltiGateway.missingEnvironment()).toEqual(['KHALTI_SECRET_KEY']);
  });

  it('requires KHALTI_BASE_URL in live mode', () => {
    process.env.PAYMENT_MODE = 'live';
    expect(khaltiGateway.missingEnvironment()).toEqual(['KHALTI_BASE_URL']);
  });

  it('initiates against the sandbox with paisa and a server-side key', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ pidx: PIDX, payment_url: 'https://test-pay.khalti.com/?pidx=' + PIDX }),
    );

    const redirect = await khaltiGateway.start({
      donationId: DONATION_ID,
      amountMinor: 10_000,
      description: 'General fund gift',
      donorName: 'Asha Rai',
      donorEmail: 'asha@example.com',
    });

    const [call] = callsTo(fetchMock);
    if (!call) throw new Error('Khalti initiation did not call fetch');
    const [url, init] = call;
    expect(url).toBe('https://dev.khalti.com/api/v2/epayment/initiate/');
    expect(init.method).toBe('POST');
    // Khalti's scheme is `key <secret>`, not Bearer.
    expect((init.headers as Record<string, string>).Authorization).toBe(`key ${SECRET}`);

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      // Khalti expects paisa, so the stored minor amount is sent unchanged.
      amount: 10_000,
      purchase_order_id: DONATION_ID,
      purchase_order_name: 'General fund gift',
      return_url: 'http://localhost:3000/api/v1/payments/khalti/callback',
      website_url: 'http://localhost:3000',
      customer_info: { name: 'Asha Rai', email: 'asha@example.com' },
    });

    expect(redirect).toEqual({ url: `https://test-pay.khalti.com/?pidx=${PIDX}`, method: 'GET' });
  });

  it("surfaces Khalti's own reason instead of a generic failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Invalid token.', status_code: 401 }, 401));

    await expect(
      khaltiGateway.start({
        donationId: DONATION_ID,
        amountMinor: 10_000,
        description: 'Gift',
        donorName: 'Donor',
        donorEmail: 'donor@example.com',
      }),
    ).rejects.toThrow(/Invalid token/);
  });

  it('rejects a response without a payment URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ pidx: PIDX }));

    await expect(
      khaltiGateway.start({
        donationId: DONATION_ID,
        amountMinor: 10_000,
        description: 'Gift',
        donorName: 'Donor',
        donorEmail: 'donor@example.com',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('looks the payment up server-side and reads the confirmed amount', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        pidx: PIDX,
        total_amount: 10_000,
        status: 'Completed',
        transaction_id: 'TXN-1',
        purchase_order_id: DONATION_ID,
      }),
    );

    const verification = await khaltiGateway.verify(new URLSearchParams({ pidx: PIDX }));

    const [call] = callsTo(fetchMock);
    if (!call) throw new Error('Khalti lookup did not call fetch');
    const [url, init] = call;
    expect(url).toBe('https://dev.khalti.com/api/v2/epayment/lookup/');
    expect(JSON.parse(String(init.body))).toEqual({ pidx: PIDX });

    expect(verification).toMatchObject({
      donationId: DONATION_ID,
      reference: 'TXN-1',
      status: 'succeeded',
      amountMinor: 10_000,
    });
  });

  it('treats anything but Completed as failed', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ pidx: PIDX, status: 'Expired', purchase_order_id: DONATION_ID }),
    );

    const verification = await khaltiGateway.verify(new URLSearchParams({ pidx: PIDX }));
    expect(verification.status).toBe('failed');
  });

  it('refuses an implausible pidx before calling Khalti', async () => {
    await expect(khaltiGateway.verify(new URLSearchParams({ pidx: 'x' }))).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
