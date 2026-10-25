import { ApiError } from '@/lib/api/errors';
import type { PaymentMethod } from '@/lib/constants/domain';

import { esewaGateway } from './esewa';
import { khaltiGateway } from './khalti';
import type { PaymentGateway, PaymentRedirect, PaymentRequest } from './types';

export type { PaymentMode } from './mode';
export { paymentMode } from './mode';

// ConnectIPS and Fonepay have no adapter yet. Only the two implemented gateways are offered.
const gateways: Partial<Record<PaymentMethod, PaymentGateway>> = {
  esewa: esewaGateway,
  khalti: khaltiGateway,
};

export function gatewayFor(method: PaymentMethod): PaymentGateway {
  const gateway = gateways[method];
  if (!gateway) {
    throw new ApiError('unavailable', `${method} is not available. Use eSewa or Khalti.`);
  }
  if (!gateway.isConfigured()) {
    throw new ApiError(
      'unavailable',
      `${method === 'esewa' ? 'eSewa' : 'Khalti'} is not configured. Add its merchant credentials.`,
    );
  }
  return gateway;
}

export async function startPayment(
  method: PaymentMethod,
  request: PaymentRequest,
): Promise<PaymentRedirect> {
  return gatewayFor(method).start(request);
}

export type { PaymentGateway, PaymentRedirect, PaymentRequest };
