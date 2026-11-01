import { accountPage } from '@/content/account';

import { config } from '../config';
import { passwordIsBreached } from './breaches';

/**
 * The one place a new password reaches Better Auth : the three endpoints whose POST bodies
 * carry a password being chosen, not one being verified. Sign-in is deliberately absent; the
 * check must not become an oracle that confirms someone's guess about an account's password.
 *
 * The guard runs *before* Better Auth so a refusal is one outbound call and no database row,
 * and it reads the body through `request.clone()`, leaving the original intact for the
 * provider handler. A malformed body or a missing password field passes straight through;
 * Better Auth's own schema still rejects those with its normal error.
 */
const PASSWORD_SET_ENDPOINTS = new Set([
  '/api/auth/sign-up/email',
  '/api/auth/change-password',
  '/api/auth/reset-password',
]);

/** Same JSON envelope as every other refusal, so the browser shows the same error bar. */
export function breachedPasswordResponse(): Response {
  return Response.json(
    { code: 'PASSWORD_BREACHED', message: accountPage.password.breached },
    { status: 400 },
  );
}

/**
 * Returns a refusal Response when the request sets a known-breached password, or undefined to
 * let Better Auth answer. Failures inside the lookup fail open, exactly like the rest of E2.
 */
export async function guardPasswordPost(request: Request): Promise<Response | undefined> {
  if (!config.passwords.breachedPasswordLookup.enabled) return undefined;

  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  if (!PASSWORD_SET_ENDPOINTS.has(path)) return undefined;

  let payload: unknown;
  try {
    payload = await request.clone().json();
  } catch {
    return undefined;
  }
  if (payload === null || typeof payload !== 'object') return undefined;

  /** `newPassword` on change/reset, `password` on signup; one request never carries both. */
  const record = payload as { password?: unknown; newPassword?: unknown };
  const candidate = typeof record.newPassword === 'string' ? record.newPassword : record.password;
  if (typeof candidate !== 'string') return undefined;

  // Outside the length bounds the provider's own validation refuses first anyway; skip the
  // network call for it.
  if (
    candidate.length < config.passwords.minLength ||
    candidate.length > config.passwords.maxLength
  ) {
    return undefined;
  }

  if (await passwordIsBreached(candidate)) return breachedPasswordResponse();
  return undefined;
}
