import { ApiError } from '@/lib/api/errors';
import { appUrl } from '@/server/http/app-url';

import { config } from '../config';
import { paymentMode } from './mode';
import type { PaymentGateway, PaymentRedirect, PaymentRequest, PaymentVerification } from './types';

/**
 * Khalti ePayment v2. Sandbox and live share the same shape; the base URL and keys differ.
 *
 * Required environment:
 *   KHALTI_SECRET_KEY
 *   KHALTI_BASE_URL in live mode
 * Optional:
 *   KHALTI_BASE_URL in sandbox mode (defaults to the sandbox API)
 */
function api(): string {
  if (process.env.KHALTI_BASE_URL) return process.env.KHALTI_BASE_URL;
  if (paymentMode() === 'live') {
    throw new ApiError('unavailable', 'KHALTI_BASE_URL is required in live mode.');
  }
  return config.payments.khaltiSandboxBaseUrl;
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${api()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `key ${process.env.KHALTI_SECRET_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.payments.timeoutMs),
  });
  const detail = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    throw new ApiError('server', 'Khalti rejected the payment request. Check the credentials.');
  }
  if (!detail) throw new ApiError('server', 'Khalti returned an empty response.');
  return detail;
}

export const khaltiGateway: PaymentGateway = {
  id: 'khalti',

  isConfigured() {
    return Boolean(process.env.KHALTI_SECRET_KEY);
  },

  async start(request: PaymentRequest): Promise<PaymentRedirect> {
    if (!this.isConfigured()) {
      throw new ApiError('unavailable', 'Khalti is not configured.');
    }

    const result = await call<{ payment_url?: string }>('/epayment/initiate/', {
      return_url: `${appUrl()}/api/v1/payments/khalti/callback`,
      website_url: appUrl(),
      amount: request.amountMinor,
      purchase_order_id: request.donationId,
      purchase_order_name: request.description,
      customer_info: { name: request.donorName, email: request.donorEmail },
    });

    if (!result.payment_url) {
      throw new ApiError('server', 'Khalti did not return a payment URL.');
    }
    return { url: result.payment_url, method: 'GET' };
  },

  async verify(query: URLSearchParams): Promise<PaymentVerification> {
    if (!this.isConfigured()) {
      throw new ApiError('unavailable', 'Khalti is not configured.');
    }
    const pidx = query.get('pidx');
    if (!pidx) throw new ApiError('validation', 'Khalti did not return a payment id.');

    const result = await call<{
      status?: string;
      transaction_id?: string;
      purchase_order_id?: string;
      total_amount?: number;
    }>('/epayment/lookup/', { pidx });

    return {
      donationId: result.purchase_order_id ?? '',
      reference: result.transaction_id ?? pidx,
      status: result.status === 'Completed' ? 'succeeded' : 'failed',
      ...(typeof result.total_amount === 'number' ? { amountMinor: result.total_amount } : {}),
      payload: { ...result, pidx },
    };
  },
};
