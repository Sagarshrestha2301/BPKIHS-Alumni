import { ApiError } from '@/lib/api/errors';

/**
 * Payments run against a gateway or not at all. There is no simulator: a donation is only
 * marked paid after a signed callback (eSewa) or a server-side lookup (Khalti).
 *
 * `PAYMENT_MODE` must be set explicitly. A missing value is a configuration error, not a
 * reason to simulate money.
 */
export type PaymentMode = 'sandbox' | 'live';

export function paymentMode(): PaymentMode {
  const mode = process.env.PAYMENT_MODE?.trim().toLowerCase();
  if (mode === 'sandbox' || mode === 'live') return mode;
  throw new ApiError(
    'unavailable',
    'Payments are not configured. Set PAYMENT_MODE to "sandbox" or "live".',
  );
}

/**
 * Live mode without throwing. The admin status page must render while `PAYMENT_MODE` is unset
 * or wrong, so it can report the problem instead of failing to load.
 */
export function isLiveMode(): boolean {
  try {
    return paymentMode() === 'live';
  } catch {
    return false;
  }
}
