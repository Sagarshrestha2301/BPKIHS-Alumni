import { botCheck } from '@/content/bot';
import { ApiError } from '@/lib/api/errors';
import { BOT_TOKEN_HEADER, TURNSTILE_VERIFY_URL } from '@/lib/constants/bot';

import { config } from '../config';

/**
 * Human verification for the public forms.
 *
 * Cloudflare Turnstile issues a short-lived token in the browser; this module asks Cloudflare
 * whether that token is genuine. Turnstile is **optional**: when `TURNSTILE_SECRET_KEY` is
 * absent (no Cloudflare account) the check is skipped entirely, which is what lets a fresh
 * clone, the browser suite and deployments without Turnstile work. Setting
 * `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` enables verification and is the
 * recommended configuration for a public launch.
 *
 * The token is single-use. Routes verify it after parsing the body, so a field error does not
 * burn the token; the widget resets itself after a failed submission.
 */
export function botProtectionConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function assertHuman(request: Request): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  // No secret means bot protection is disabled; submissions are accepted without a token.
  if (!secret) return;

  const token = request.headers.get(BOT_TOKEN_HEADER)?.trim();
  if (!token) throw new ApiError('validation', botCheck.missing);

  let payload: { success?: boolean } | null;
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(config.bot.timeoutMs),
    });
    payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
  } catch (error) {
    // A provider outage must not silently let a bot through; the visitor is asked to retry.
    console.error('[bot] verification request failed', error);
    throw new ApiError('unavailable', botCheck.unavailable);
  }

  if (!payload?.success) throw new ApiError('validation', botCheck.failed);
}
