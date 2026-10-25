import { createHmac, timingSafeEqual } from 'node:crypto';

import { ApiError } from '@/lib/api/errors';
import { appUrl } from '@/server/http/app-url';

import { config } from '../config';
import { paymentMode } from './mode';
import type { PaymentGateway, PaymentRedirect, PaymentRequest, PaymentVerification } from './types';

/**
 * eSewa ePay v2.
 *
 * Required environment:
 *   ESEWA_PRODUCT_CODE, ESEWA_SECRET_KEY
 *   ESEWA_GATEWAY_URL in live mode
 * Optional:
 *   ESEWA_GATEWAY_URL in sandbox mode (defaults to the sandbox form URL)
 *
 * The signature covers `total_amount`, `transaction_uuid` and `product_code`, in that order.
 */
function gatewayUrl(): string {
  if (process.env.ESEWA_GATEWAY_URL) return process.env.ESEWA_GATEWAY_URL;
  if (paymentMode() === 'live') {
    throw new ApiError('unavailable', 'ESEWA_GATEWAY_URL is required in live mode.');
  }
  return config.payments.esewaSandboxUrl;
}

function sign(message: string): string {
  return createHmac('sha256', process.env.ESEWA_SECRET_KEY ?? '')
    .update(message)
    .digest('base64');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const esewaGateway: PaymentGateway = {
  id: 'esewa',

  isConfigured() {
    return Boolean(process.env.ESEWA_PRODUCT_CODE && process.env.ESEWA_SECRET_KEY);
  },

  async start(request: PaymentRequest): Promise<PaymentRedirect> {
    if (!this.isConfigured()) {
      throw new ApiError('unavailable', 'eSewa is not configured.');
    }
    const productCode = process.env.ESEWA_PRODUCT_CODE as string;
    const total = (request.amountMinor / 100).toFixed(2);
    const message = `total_amount=${total},transaction_uuid=${request.donationId},product_code=${productCode}`;

    return {
      url: gatewayUrl(),
      method: 'POST',
      fields: {
        amount: total,
        tax_amount: '0',
        total_amount: total,
        transaction_uuid: request.donationId,
        product_code: productCode,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: `${appUrl()}/api/v1/payments/esewa/callback`,
        failure_url: `${appUrl()}/donate/thank-you?status=failed`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: sign(message),
      },
    };
  },

  async verify(query: URLSearchParams): Promise<PaymentVerification> {
    if (!this.isConfigured()) {
      throw new ApiError('unavailable', 'eSewa is not configured.');
    }
    const data = query.get('data');
    if (!data) throw new ApiError('validation', 'eSewa did not return a signed payload.');

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new ApiError('validation', 'The eSewa callback payload could not be read.');
    }

    const names = String(payload.signed_field_names ?? '');
    if (!names) throw new ApiError('validation', 'The eSewa payload is not signed.');

    // A valid signature from another merchant must not complete one of our donations.
    if (String(payload.product_code ?? '') !== process.env.ESEWA_PRODUCT_CODE) {
      throw new ApiError('validation', 'The eSewa callback is for another product.');
    }

    const message = names
      .split(',')
      .map((name) => `${name}=${String(payload[name] ?? '')}`)
      .join(',');
    const signature = String(payload.signature ?? '');
    if (!safeEqual(sign(message), signature)) {
      throw new ApiError('validation', 'The eSewa signature did not match.');
    }

    const status = payload.status === 'COMPLETE' ? 'succeeded' : 'failed';
    const total = Number(payload.total_amount);
    return {
      donationId: String(payload.transaction_uuid ?? ''),
      reference: String(payload.transaction_code ?? payload.transaction_uuid ?? ''),
      status,
      ...(Number.isFinite(total) ? { amountMinor: Math.round(total * 100) } : {}),
      payload,
    };
  },
};
