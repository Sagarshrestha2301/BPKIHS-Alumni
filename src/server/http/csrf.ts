import { ApiError } from '@/lib/api/errors';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  SESSION_COOKIE_PATTERN,
} from '@/lib/constants/security';

import { config } from '../config';

/**
 * Double-submit CSRF protection for cookie-authenticated mutations.
 *
 * The edge proxy issues a random token in a `SameSite=Lax` cookie that the browser can read.
 * A mutation must echo the same value in `x-csrf-token`; a cross-site attacker can send the
 * cookie but cannot read it to fill the header. Requests without a session cookie are left to
 * the origin check and the rate limiter: there is no ambient authority to abuse.
 */

export function createCsrfToken(): string {
  return `${crypto.randomUUID()}.${crypto.randomUUID()}`;
}

function cookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }
  return null;
}

/** Length-safe comparison, so a mismatch does not leak how much of the token was right. */
function safeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

export function hasSessionCookie(request: Request): boolean {
  return SESSION_COOKIE_PATTERN.test(request.headers.get('cookie') ?? '');
}

export function assertCsrf(request: Request): void {
  if (!hasSessionCookie(request)) return;

  const cookieToken = cookieValue(request.headers.get('cookie'), CSRF_COOKIE_NAME);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    throw new ApiError(
      'forbidden',
      'The security token is missing or stale. Reload the page and try again.',
    );
  }
}

/** The cookie options the proxy uses when it issues a token. */
export function csrfCookieOptions(secure: boolean) {
  return {
    httpOnly: false,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: config.csrf.cookieMaxAgeSeconds,
  };
}
