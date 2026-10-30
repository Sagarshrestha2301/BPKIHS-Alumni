import type { ImplementedPaymentMethod } from '@/lib/constants/domain';

import { availablePaymentMethods, gatewayLabel, implementedGateways } from './index';
import { type PaymentMode, paymentMode } from './mode';
import type { PaymentGatewayId } from './types';

export interface GatewayStatus {
  id: PaymentGatewayId;
  label: string;
  /** Fonepay is agreed but has no adapter, so it is listed with `hasAdapter: false`. */
  hasAdapter: boolean;
  configured: boolean;
  /** Actually offered at checkout: adapter present, credentials complete and a valid mode. */
  offered: boolean;
  /** Environment variable names that are missing, never their values. */
  missing: string[];
}

export interface GatewayOverview {
  /** `null` when `PAYMENT_MODE` is missing or invalid; the page reports it rather than throwing. */
  mode: PaymentMode | null;
  gateways: GatewayStatus[];
}

/**
 * Describes the payment setup for the admin dashboard. The `configured` and `offered` flags come
 * from the same functions the checkout uses, so the page cannot disagree with what a donor sees.
 */
export function gatewayOverview(): GatewayOverview {
  let mode: PaymentMode | null = null;
  try {
    mode = paymentMode();
  } catch {
    // Reported as `mode: null`; the adapters also treat an invalid mode as "not offered".
  }

  const offered = new Set<ImplementedPaymentMethod>(availablePaymentMethods());
  const gateways: GatewayStatus[] = implementedGateways().map((gateway) => ({
    id: gateway.id,
    label: gatewayLabel(gateway.id),
    hasAdapter: true,
    configured: gateway.isConfigured(),
    offered: offered.has(gateway.id as ImplementedPaymentMethod),
    missing: gateway.missingEnvironment(),
  }));

  gateways.push({
    id: 'fonepay',
    label: gatewayLabel('fonepay'),
    hasAdapter: false,
    configured: false,
    offered: false,
    missing: [],
  });

  return { mode, gateways };
}
