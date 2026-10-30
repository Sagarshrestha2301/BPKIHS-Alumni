import { ApiError } from '@/lib/api/errors';
import {
  IMPLEMENTED_PAYMENT_METHODS,
  type ImplementedPaymentMethod,
  type PaymentMethod,
} from '@/lib/constants/domain';

import { connectipsGateway } from './connectips';
import { esewaGateway } from './esewa';
import { khaltiGateway } from './khalti';
import { paymentMode } from './mode';
import type { PaymentGateway, PaymentGatewayId, PaymentRedirect, PaymentRequest } from './types';

export type { PaymentMode } from './mode';
export { paymentMode } from './mode';

/** Every gateway here has an adapter. Fonepay does not yet, so it is deliberately absent. */
const gateways: Record<ImplementedPaymentMethod, PaymentGateway> = {
  esewa: esewaGateway,
  khalti: khaltiGateway,
  connectips: connectipsGateway,
};

const GATEWAY_LABELS: Record<PaymentGatewayId, string> = {
  esewa: 'eSewa',
  khalti: 'Khalti',
  connectips: 'ConnectIPS',
  fonepay: 'Fonepay',
};

export function gatewayLabel(id: PaymentGatewayId): string {
  return GATEWAY_LABELS[id];
}

/** Every adapter, in checkout order. Used by the admin status page. */
export function implementedGateways(): PaymentGateway[] {
  return IMPLEMENTED_PAYMENT_METHODS.map((method) => gateways[method]);
}

export function gatewayFor(method: PaymentMethod): PaymentGateway {
  const gateway = (gateways as Partial<Record<PaymentMethod, PaymentGateway>>)[method];
  if (!gateway) {
    throw new ApiError(
      'unavailable',
      `${GATEWAY_LABELS[method as PaymentGatewayId] ?? method} is not available. Choose one of the configured payment methods.`,
    );
  }
  if (!gateway.isConfigured()) {
    throw new ApiError(
      'unavailable',
      `${GATEWAY_LABELS[gateway.id]} is not configured. Add its merchant credentials.`,
    );
  }
  return gateway;
}

/**
 * Methods the checkout may offer: an adapter exists and its credentials are present. A gateway
 * that is only half configured stays hidden rather than failing after the donor has chosen it.
 * No payment mode means payments cannot start at all, so the list is empty instead of throwing
 * while a page renders.
 */
export function availablePaymentMethods(): ImplementedPaymentMethod[] {
  try {
    paymentMode();
  } catch {
    return [];
  }
  return IMPLEMENTED_PAYMENT_METHODS.filter((method) => gateways[method].isConfigured());
}

export async function startPayment(
  method: PaymentMethod,
  request: PaymentRequest,
): Promise<PaymentRedirect> {
  return gatewayFor(method).start(request);
}

export type { PaymentGateway, PaymentGatewayId, PaymentRedirect, PaymentRequest };
